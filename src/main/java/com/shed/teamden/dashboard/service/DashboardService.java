package com.shed.teamden.dashboard.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.attendance.entity.AttendanceRecord;
import com.shed.teamden.attendance.entity.AttendanceStatus;
import com.shed.teamden.attendance.repository.AttendanceRecordRepository;
import com.shed.teamden.auth.dto.UserProfileDto;
import com.shed.teamden.dashboard.dto.*;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final ActivityEventRepository activityEventRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryDto getDashboardSummary() {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();

        if (orgId == null) {
            log.warn("User {} has no active organization membership", user.getId());
            return DashboardSummaryDto.builder()
                    .userProfile(mapUserProfile(user))
                    .kpis(KpiMetricsDto.builder().build())
                    .myTasks(Collections.emptyList())
                    .projects(Collections.emptyList())
                    .recentActivity(Collections.emptyList())
                    .attendance(AttendanceSummaryDto.builder().todayDate(LocalDate.now(ZoneOffset.UTC)).build())
                    .build();
        }

        // 1. KPI Metrics
        KpiMetricsDto kpis = calculateKpis(orgId);

        // 2. My Tasks (assigned to current user in this organization)
        List<TaskItemDto> myTasks = taskRepository.findByOrganizationIdAndAssigneeId(
                orgId, user.getId(), PageRequest.of(0, 10)
        ).stream().map(this::mapTaskItem).collect(Collectors.toList());

        // 3. Projects Overview with calculated progress
        List<ProjectItemDto> projects = projectRepository.findByOrganizationIdWithDetails(orgId).stream()
                .map(this::mapProjectItem)
                .collect(Collectors.toList());

        // 4. Recent Activity
        List<ActivityItemDto> recentActivity = activityEventRepository.findRecentByOrganizationId(
                orgId, PageRequest.of(0, 10)
        ).stream().map(this::mapActivityItem).collect(Collectors.toList());

        // 5. Attendance Summary for today
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        boolean isOwner = (user.getActiveRole() == MembershipRole.OWNER);
        AttendanceSummaryDto attendance = getAttendanceSummary(orgId, user.getId(), today, kpis.getTeamMembersPresentToday(), isOwner);

        return DashboardSummaryDto.builder()
                .userProfile(mapUserProfile(user))
                .kpis(kpis)
                .myTasks(myTasks)
                .projects(projects)
                .recentActivity(recentActivity)
                .attendance(attendance)
                .build();
    }

    @Transactional(readOnly = true)
    public KpiMetricsDto calculateKpis(UUID orgId) {
        // Active projects: PLANNING, ACTIVE
        long activeProjects = projectRepository.countByOrganizationIdAndStatusIn(
                orgId,
                List.of(ProjectStatus.ACTIVE, ProjectStatus.PLANNING)
        );

        // Open task statuses: pending, in-progress, in-review, blocked
        long openTasks = taskRepository.countByOrganizationIdAndStatusIn(
                orgId,
                List.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.BLOCKED)
        );

        // Tasks completed this week: current Monday 00:00:00 UTC to Sunday 23:59:59 UTC
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        Instant startOfWeek = monday.atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant endOfWeek = sunday.atTime(LocalTime.MAX).atZone(ZoneOffset.UTC).toInstant();

        long completedThisWeek = taskRepository.countCompletedTasksInTimeRange(
                orgId, TaskStatus.COMPLETED, startOfWeek, endOfWeek
        );

        // Present today: PRESENT, HALF_DAY
        long presentToday = attendanceRecordRepository.countByOrganizationIdAndAttendanceDateAndStatusIn(
                orgId,
                today,
                List.of(AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY)
        );

        return KpiMetricsDto.builder()
                .activeProjects(activeProjects)
                .openTasks(openTasks)
                .tasksCompletedThisWeek(completedThisWeek)
                .teamMembersPresentToday(presentToday)
                .build();
    }

    private TaskItemDto mapTaskItem(Task t) {
        return TaskItemDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .projectName(t.getProject() != null ? t.getProject().getName() : null)
                .projectId(t.getProject() != null ? t.getProject().getId() : null)
                .priority(t.getPriority())
                .status(t.getStatus())
                .dueDate(t.getDueDate())
                .build();
    }

    private ProjectItemDto mapProjectItem(Project p) {
        // Progress rule: completed eligible tasks / total eligible tasks (excluding CANCELLED)
        long totalEligible = taskRepository.countEligibleTasksByProjectId(
                p.getId(), List.of(TaskStatus.CANCELLED)
        );
        long completed = taskRepository.countCompletedTasksByProjectId(
                p.getId(), TaskStatus.COMPLETED
        );

        Integer progress = null;
        if (totalEligible > 0) {
            progress = (int) Math.round(((double) completed / totalEligible) * 100);
        }

        return ProjectItemDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .status(p.getStatus())
                .ownerName(p.getOwner() != null ? p.getOwner().getFullName() : null)
                .startDate(p.getStartDate())
                .dueDate(p.getDueDate())
                .progressPercentage(progress)
                .totalTasks(totalEligible)
                .completedTasks(completed)
                .build();
    }

    private ActivityItemDto mapActivityItem(ActivityEvent e) {
        String actorName = e.getActor() != null ? e.getActor().getFullName() : "System";
        return ActivityItemDto.builder()
                .id(e.getId())
                .eventType(e.getEventType())
                .title(e.getTitle())
                .description(e.getDescription())
                .actorName(actorName)
                .actorInitials(UserProfileDto.computeInitials(actorName))
                .eventTimestamp(e.getEventTimestamp())
                .build();
    }

    private AttendanceSummaryDto getAttendanceSummary(UUID orgId, UUID userId, LocalDate today, long totalPresent, boolean isOwner) {
        Optional<AttendanceRecord> record = attendanceRecordRepository
                .findByOrganizationIdAndEmployeeIdAndAttendanceDate(orgId, userId, today);

        Instant checkIn = record.map(r -> r.getCheckInTime()).orElse(null);
        Instant checkOut = record.map(r -> r.getCheckOutTime()).orElse(null);
        AttendanceStatus status = record.map(r -> r.getStatus()).orElse(null);

        return AttendanceSummaryDto.builder()
                .todayDate(today)
                .exempt(isOwner)
                .checkedIn(record.isPresent())
                .checkInTime(checkIn)
                .checkOutTime(checkOut)
                .status(status)
                .totalPresentToday(totalPresent)
                .build();
    }

    @Transactional
    public ProjectItemDto createProject(CreateProjectRequest request) {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new com.shed.teamden.common.exception.BadRequestException("Active organization not found"));
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new com.shed.teamden.common.exception.UnauthorizedException("User not found"));

        Project project = Project.builder()
                .organization(org)
                .name(request.getName().trim())
                .description(request.getDescription())
                .status(ProjectStatus.ACTIVE)
                .owner(currentUser)
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .build();

        project = projectRepository.save(project);

        activityEventRepository.save(ActivityEvent.builder()
                .organization(project.getOrganization())
                .actor(project.getOwner())
                .eventType(com.shed.teamden.activity.entity.ActivityEventType.PROJECT_CREATED)
                .entityType("PROJECT")
                .entityId(project.getId())
                .title("Created Project: " + project.getName())
                .description(project.getDescription())
                .eventTimestamp(Instant.now())
                .build());

        log.info("Project '{}' created in org {}", project.getName(), orgId);
        return mapProjectItem(project);
    }

    @Transactional
    public TaskItemDto createTask(CreateTaskRequest request) {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new com.shed.teamden.common.exception.BadRequestException("Active organization not found"));
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new com.shed.teamden.common.exception.UnauthorizedException("User not found"));

        Project project = null;
        if (request.getProjectId() != null) {
            project = projectRepository.findByOrganizationIdAndId(orgId, request.getProjectId())
                    .orElseThrow(() -> new com.shed.teamden.common.exception.BadRequestException("Project not found in this organization"));
        }

        Task task = Task.builder()
                .organization(org)
                .project(project)
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .creator(currentUser)
                .assignee(currentUser) // default self-assigned for My Tasks
                .priority(request.getPriority() != null ? request.getPriority() : com.shed.teamden.task.entity.TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .dueDate(request.getDueDate())
                .build();

        task = taskRepository.save(task);

        activityEventRepository.save(ActivityEvent.builder()
                .organization(task.getOrganization())
                .actor(currentUser)
                .eventType(com.shed.teamden.activity.entity.ActivityEventType.TASK_CREATED)
                .entityType("TASK")
                .entityId(task.getId())
                .title("Created Task: " + task.getTitle())
                .description(task.getDescription())
                .eventTimestamp(Instant.now())
                .build());

        log.info("Task '{}' created in org {}", task.getTitle(), orgId);
        return mapTaskItem(task);
    }

    @Transactional
    public AttendanceSummaryDto toggleAttendance() {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new com.shed.teamden.common.exception.BadRequestException("Active organization not found"));
        User currentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new com.shed.teamden.common.exception.UnauthorizedException("User not found"));

        Optional<AttendanceRecord> existing = attendanceRecordRepository
                .findByOrganizationIdAndEmployeeIdAndAttendanceDate(orgId, user.getId(), today);

        if (existing.isEmpty()) {
            // Check in
            AttendanceRecord record = AttendanceRecord.builder()
                    .organization(org)
                    .employee(currentUser)
                    .attendanceDate(today)
                    .checkInTime(Instant.now())
                    .status(AttendanceStatus.PRESENT)
                    .build();
            attendanceRecordRepository.save(record);

            activityEventRepository.save(ActivityEvent.builder()
                .organization(record.getOrganization())
                .actor(currentUser)
                .eventType(com.shed.teamden.activity.entity.ActivityEventType.ATTENDANCE_CHECKIN)
                .entityType("ATTENDANCE")
                .entityId(record.getId())
                .title("Checked in for the day")
                .description("Attendance recorded as PRESENT")
                .eventTimestamp(Instant.now())
                .build());
        } else {
            // Check out
            AttendanceRecord record = existing.get();
            if (record.getCheckOutTime() == null) {
                record.setCheckOutTime(Instant.now());
                attendanceRecordRepository.save(record);
            }
        }

        long presentToday = attendanceRecordRepository.countByOrganizationIdAndAttendanceDateAndStatusIn(
                orgId, today, List.of(AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY)
        );

        boolean isOwner = (user.getActiveRole() == MembershipRole.OWNER);
        return getAttendanceSummary(orgId, user.getId(), today, presentToday, isOwner);
    }

    private UserProfileDto mapUserProfile(CustomUserDetails user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .status(user.getStatus())
                .activeOrganizationId(user.getActiveOrganizationId())
                .activeOrganizationName(user.getActiveOrganizationName())
                .role(user.getActiveRole())
                .initials(UserProfileDto.computeInitials(user.getFullName()))
                .build();
    }
}
