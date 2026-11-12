package com.shed.teamden.dashboard.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.activity.service.ActivityService;
import com.shed.teamden.dashboard.dto.*;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.KanbanColumn;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.calendar.entity.CalendarEvent;
import com.shed.teamden.calendar.repository.CalendarEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ActivityEventRepository activityEventRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final CalendarEventRepository calendarEventRepository;

    @Transactional
    public DashboardDataDto getDashboardData() {
        try {
            Organization organization = resolveCurrentOrganization();
            User currentUser = resolveCurrentUser(organization);

            LocalDate today = LocalDate.now();
            String dayOfWeek = today.getDayOfWeek().name();
            String month = today.getMonth().name().substring(0, 3);
            String year = String.valueOf(today.getYear());
            String dayNum = String.format("%02d", today.getDayOfMonth());
            String shortDow = dayOfWeek.substring(0, 3);
            String formattedDate = shortDow + ", " + dayNum + " " + month + " " + year;

            // Fetch real tasks for current organization from PostgreSQL
            List<Task> allTasks = taskRepository.findByOrganizationId(organization.getId(), PageRequest.of(0, 100));

            // Group tasks into NOW, NEXT, LATER based on priority and due date rules
            List<PriorityTaskDto> nowTasks = new ArrayList<>();
            List<PriorityTaskDto> nextTasks = new ArrayList<>();
            List<PriorityTaskDto> laterTasks = new ArrayList<>();

            // 1. Identify Hero Priority Task (highest open priority task)
            Task heroCandidate = allTasks.stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getStatus() != TaskStatus.CANCELLED)
                    .max((a, b) -> isHigherPriority(a, b) ? 1 : -1)
                    .orElse(null);

            final UUID heroId = heroCandidate != null ? heroCandidate.getId() : null;

            // 2. Populate Kanban Columns (NOW, NEXT, LATER) with all active tasks
            List<Task> openTasks = allTasks.stream()
                    .filter(t -> t.getStatus() != TaskStatus.CANCELLED)
                    .sorted(Comparator.comparingInt(Task::getColumnOrder)
                            .thenComparing(Task::getCreatedAt))
                    .collect(Collectors.toList());

            List<Task> nowColTasks = openTasks.stream()
                    .filter(t -> (t.getKanbanColumn() == null || t.getKanbanColumn() == KanbanColumn.NOW))
                    .collect(Collectors.toList());

            List<Task> nextColTasks = openTasks.stream()
                    .filter(t -> t.getKanbanColumn() == KanbanColumn.NEXT)
                    .collect(Collectors.toList());

            List<Task> laterColTasks = openTasks.stream()
                    .filter(t -> t.getKanbanColumn() == KanbanColumn.LATER)
                    .collect(Collectors.toList());

            int seqCounter = 1;
            for (Task task : nowColTasks) {
                PriorityTaskDto dto = toPriorityTaskDto(task, String.format("%02d", seqCounter++));
                nowTasks.add(dto);
            }
            for (Task task : nextColTasks) {
                PriorityTaskDto dto = toPriorityTaskDto(task, String.format("%02d", seqCounter++));
                nextTasks.add(dto);
            }
            for (Task task : laterColTasks) {
                PriorityTaskDto dto = toPriorityTaskDto(task, String.format("%02d", seqCounter++));
                laterTasks.add(dto);
            }

            // Hero Priority DTO from real database task
            HeroPriorityDto hero = null;
            if (heroCandidate != null) {
                String dueDay = "--";
                String dueMonth = "";
                String dueYear = "";
                if (heroCandidate.getDueDate() != null) {
                    dueDay = String.format("%02d", heroCandidate.getDueDate().getDayOfMonth());
                    dueMonth = heroCandidate.getDueDate().getMonth().name().substring(0, 3);
                    dueYear = String.valueOf(heroCandidate.getDueDate().getYear());
                }

                hero = HeroPriorityDto.builder()
                        .prefix("01 / NEXT PRIORITY")
                        .title(heroCandidate.getTitle())
                        .projectTag(heroCandidate.getProject() != null ? heroCandidate.getProject().getName() : "General")
                        .teamTag(heroCandidate.getAssignee() != null ? heroCandidate.getAssignee().getFullName() : "Team")
                        .priorityLabel(heroCandidate.getPriority().name().substring(0, 1) + heroCandidate.getPriority().name().substring(1).toLowerCase())
                        .description(heroCandidate.getDescription() != null ? heroCandidate.getDescription() : "")
                        .attachments(List.of())
                        .dueDayNum(dueDay)
                        .dueMonthYear((dueMonth + " " + dueYear).trim())
                        .ctaText("Continue task →")
                        .build();
            }

            // Fetch real activity events from PostgreSQL
            List<ActivityEvent> activityEvents = activityEventRepository.findRecentByOrganizationId(organization.getId(), PageRequest.of(0, 10));
            List<ActivityItemDto> activities = new ArrayList<>();
            DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault());
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("d MMM").withZone(ZoneId.systemDefault());

            for (ActivityEvent event : activityEvents) {
                String authorName = event.getActor() != null ? event.getActor().getFullName() : "System";
                String dot = event.getDotColor() != null ? event.getDotColor() : "purple";
                String badge = event.getBadgeType() != null ? event.getBadgeType() : "COMMENT";
                String actionText = event.getActionText() != null ? event.getActionText() : (event.getTitle() != null ? event.getTitle() : "updated");
                String targetTitle = event.getTargetTitle() != null ? event.getTargetTitle() : (event.getDescription() != null ? event.getDescription() : "Activity");
                String subMeta = event.getSubMeta() != null ? event.getSubMeta() : (event.getProject() != null ? event.getProject().getName() + " / Team" : "Workspace / General");
                String quotePreview = event.getQuotePreview();
                String infoText = event.getInfoText();

                Instant eventInstant = event.getEventTimestamp();
                String timeStr = "09:42";
                String dayLabel = "TODAY";
                if (eventInstant != null) {
                    timeStr = timeFmt.format(eventInstant);
                    LocalDate eventDate = eventInstant.atZone(ZoneId.systemDefault()).toLocalDate();
                    if (eventDate.equals(today)) {
                        dayLabel = "TODAY";
                    } else if (eventDate.equals(today.minusDays(1))) {
                        dayLabel = "YESTERDAY";
                    } else {
                        dayLabel = dateFmt.format(eventInstant).toUpperCase();
                    }
                }

                activities.add(ActivityItemDto.builder()
                        .id("act-" + event.getId().toString().substring(0, 8))
                        .time(timeStr)
                        .dayLabel(dayLabel)
                        .dotColor(dot)
                        .badgeType(badge)
                        .author(authorName)
                        .actionText(actionText)
                        .targetTitle(targetTitle)
                        .subMeta(subMeta)
                        .quotePreview(quotePreview)
                        .infoText(infoText)
                        .build());
            }

            // Real Attention Counts calculated from PostgreSQL database
            long blockedCount = taskRepository.countByOrganizationIdAndStatusIn(organization.getId(), List.of(TaskStatus.BLOCKED));
            long inReviewCount = taskRepository.countByOrganizationIdAndStatusIn(organization.getId(), List.of(TaskStatus.IN_REVIEW));
            long unassignedProjectsCount = projectRepository.countByOrganizationIdAndOwnerIsNull(organization.getId());

            List<AttentionAlertDto> attention = List.of(
                    AttentionAlertDto.builder()
                            .id("att-1")
                            .count(String.format("%02d", blockedCount))
                            .title("Blocked tasks")
                            .subtitle("Require your input")
                            .bgType(blockedCount > 0 ? "peach" : "neutral")
                            .url("#blocked-tasks")
                            .build(),
                    AttentionAlertDto.builder()
                            .id("att-2")
                            .count(String.format("%02d", inReviewCount))
                            .title("Tasks waiting for others")
                            .subtitle("In review / waiting")
                            .bgType(inReviewCount > 0 ? "peach" : "neutral")
                            .url("#waiting-tasks")
                            .build(),
                    AttentionAlertDto.builder()
                            .id("att-3")
                            .count(String.format("%02d", unassignedProjectsCount))
                            .title("Unassigned projects")
                            .subtitle(unassignedProjectsCount > 0 ? "Require project lead" : "All projects assigned")
                            .bgType(unassignedProjectsCount > 0 ? "peach" : "neutral")
                            .url("#unassigned-projects")
                            .build()
            );

            // Schedule items (YOUR DAY) queried from PostgreSQL Calendar
            List<CalendarEvent> todayEvents = calendarEventRepository
                    .findByOrganizationIdAndEventDateBetweenOrderByEventDateAscStartTimeAsc(organization.getId(), today, today);
            List<ScheduleItemDto> schedule = new ArrayList<>();
            for (CalendarEvent event : todayEvents) {
                String subMeta = event.getSubtitle() != null && !event.getSubtitle().isBlank() 
                        ? event.getSubtitle() 
                        : (event.getProject() != null ? event.getProject() : "");
                String dotColor = event.getColorTheme() != null && !event.getColorTheme().isBlank()
                        ? event.getColorTheme()
                        : "green";
                schedule.add(ScheduleItemDto.builder()
                        .id(event.getId().toString())
                        .time(event.getStartTime() != null ? event.getStartTime().toString() : "09:00")
                        .title(event.getTitle())
                        .subMeta(subMeta)
                        .dotColor(dotColor)
                        .build());
            }

        return DashboardDataDto.builder()
                .workspaceBreadcrumb("YOUR WORKSPACE / 01")
                .currentDateLabel(formattedDate)
                .dayNumber(dayNum)
                .dayOfWeek(dayOfWeek)
                .month(month)
                .year(year)
                .heroPriority(hero)
                .nowTasks(nowTasks)
                .nextTasks(nextTasks)
                .laterTasks(laterTasks)
                .activities(activities)
                .schedule(schedule)
                .attentionItems(attention)
                .build();
        } catch (Throwable t) {
            log.error("Error generating dashboard data: {}", t.getMessage(), t);
            throw new RuntimeException("Failed to load dashboard data: " + t.getMessage(), t);
        }
    }

    @Transactional
    public PriorityTaskDto toggleTask(String taskId) {
        if (taskId == null || taskId.isBlank()) {
            throw new BadRequestException("Task ID is required");
        }

        UUID taskUuid;
        try {
            taskUuid = UUID.fromString(taskId.trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid task ID format");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        Task task = taskRepository.findById(taskUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(organization.getId())) {
            throw new BadRequestException("Task does not belong to the active organization");
        }

        boolean willBeCompleted = (task.getStatus() != TaskStatus.COMPLETED);
        task.setStatus(willBeCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO);
        task.setCompletedAt(willBeCompleted ? Instant.now() : null);
        taskRepository.save(task);

        // Record activity event
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(currentUser != null ? currentUser : (task.getAssignee() != null ? task.getAssignee() : task.getCreator()))
                .eventType(willBeCompleted ? ActivityEventType.TASK_COMPLETED : ActivityEventType.TASK_STATUS_CHANGED)
                .entityType("TASK")
                .entityId(task.getId())
                .title(willBeCompleted ? "completed task" : "reopened task")
                .description(task.getTitle())
                .actionText(willBeCompleted ? "completed" : "reopened")
                .targetTitle(task.getTitle())
                .subMeta(task.getProject() != null ? task.getProject().getName() + " / Tasks" : "Workspace / General")
                .badgeType(willBeCompleted ? "COMPLETED" : "ASSIGNED")
                .dotColor(willBeCompleted ? "green" : "orange")
                .eventTimestamp(Instant.now())
                .build();
        activityEventRepository.save(event);

        return toPriorityTaskDto(task, "01");
    }

    @Transactional
    public PriorityTaskDto moveTask(String taskId, MoveTaskRequestDto request) {
        if (taskId == null || taskId.isBlank()) {
            throw new BadRequestException("Task ID is required");
        }
        if (request == null || request.getTargetColumn() == null || request.getTargetColumn().isBlank()) {
            throw new BadRequestException("Target column is required");
        }

        UUID taskUuid;
        try {
            taskUuid = UUID.fromString(taskId.trim());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid task ID format");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        Task task = taskRepository.findById(taskUuid)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (!task.getOrganization().getId().equals(organization.getId())) {
            throw new BadRequestException("Task does not belong to the active organization");
        }

        KanbanColumn oldColumn = task.getKanbanColumn() != null ? task.getKanbanColumn() : KanbanColumn.NOW;
        KanbanColumn newColumn = KanbanColumn.fromString(request.getTargetColumn());

        task.setKanbanColumn(newColumn);
        if (request.getTargetIndex() != null) {
            task.setColumnOrder(request.getTargetIndex());
        }

        task = taskRepository.save(task);

        // Record activity event
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(currentUser)
                .eventType(ActivityEventType.TASK_MOVED)
                .entityType("TASK")
                .entityId(task.getId())
                .title("moved task")
                .description(String.format("Moved '%s' from %s to %s", task.getTitle(), oldColumn.name(), newColumn.name()))
                .actionText("moved task to " + newColumn.name())
                .targetTitle(task.getTitle())
                .subMeta(task.getProject() != null ? task.getProject().getName() + " / Kanban" : "Workspace / General")
                .badgeType("ASSIGNED")
                .dotColor("blue")
                .eventTimestamp(Instant.now())
                .build();
        activityEventRepository.save(event);

        return toPriorityTaskDto(task, "01");
    }

    @Transactional
    public PriorityTaskDto addTask(String column, String title, String tag) {
        return addTask(column, title, tag, null);
    }

    @Transactional
    public PriorityTaskDto addTask(String column, String title, String tag, String projectId) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        String col = (column != null ? column.toUpperCase() : "NOW");
        TaskPriority priority = TaskPriority.HIGH;
        LocalDate dueDate = LocalDate.now();

        if ("NEXT".equals(col)) {
            priority = TaskPriority.MEDIUM;
            dueDate = LocalDate.now().plusDays(1);
        } else if ("LATER".equals(col)) {
            priority = TaskPriority.LOW;
            dueDate = LocalDate.now().plusDays(7);
        }

        // Validate or resolve project
        Project project = null;
        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID projUuid = UUID.fromString(projectId.trim());
                Optional<Project> projOpt = projectRepository.findById(projUuid);
                if (projOpt.isEmpty() || !projOpt.get().getOrganization().getId().equals(organization.getId())) {
                    throw new BadRequestException("Project not found in this organization");
                }
                project = projOpt.get();
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid project ID format");
            }
        } else if (tag != null && !tag.isBlank() && !"General".equalsIgnoreCase(tag)) {
            List<Project> projects = projectRepository.findByOrganizationIdWithDetails(organization.getId());
            project = projects.stream()
                    .filter(p -> p.getName().equalsIgnoreCase(tag.trim()))
                    .findFirst()
                    .orElse(null);
            if (project == null) {
                project = Project.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .name(tag.trim())
                        .owner(currentUser)
                        .status(ProjectStatus.ACTIVE)
                        .startDate(LocalDate.now())
                        .build();
                project = projectRepository.save(project);
            }
        }

        Task newTask = Task.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .project(project)
                .creator(currentUser)
                .assignee(currentUser)
                .title(title != null && !title.isBlank() ? title.trim() : "New priority task")
                .description("Created from dashboard")
                .priority(priority)
                .status(TaskStatus.TODO)
                .kanbanColumn(KanbanColumn.fromString(col))
                .columnOrder(99)
                .dueDate(dueDate)
                .build();

        newTask = taskRepository.save(newTask);

        // Record activity event in PostgreSQL
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(currentUser)
                .eventType(ActivityEventType.TASK_CREATED)
                .entityType("TASK")
                .entityId(newTask.getId())
                .title("created task")
                .description(newTask.getTitle())
                .actionText("created task")
                .targetTitle(newTask.getTitle())
                .subMeta(newTask.getProject() != null ? newTask.getProject().getName() + " / Workspace" : "Workspace / General")
                .badgeType("ASSIGNED")
                .dotColor("orange")
                .eventTimestamp(Instant.now())
                .build();
        activityEventRepository.save(event);

        return toPriorityTaskDto(newTask, "01");
    }

    private boolean isHigherPriority(Task a, Task b) {
        int pA = a.getPriority() != null ? a.getPriority().ordinal() : 0;
        int pB = b.getPriority() != null ? b.getPriority().ordinal() : 0;
        if (pA != pB) return pA > pB;
        if (a.getDueDate() != null && b.getDueDate() != null) {
            return a.getDueDate().isBefore(b.getDueDate());
        }
        return false;
    }

    private PriorityTaskDto toPriorityTaskDto(Task task, String indexNum) {
        String dot = "gray";
        String dueLabel = "Upcoming";
        LocalDate today = LocalDate.now();

        if (task.getDueDate() != null) {
            if (task.getDueDate().isEqual(today)) {
                dot = "red";
                dueLabel = "Today";
            } else if (task.getDueDate().isEqual(today.plusDays(1))) {
                dot = "orange";
                dueLabel = "Tomorrow";
            } else {
                dot = "blue";
                dueLabel = task.getDueDate().format(DateTimeFormatter.ofPattern("EEE, dd MMM"));
            }
        }

        String colName = task.getKanbanColumn() != null ? task.getKanbanColumn().name() : "NOW";
        return PriorityTaskDto.builder()
                .id(task.getId().toString())
                .column(colName)
                .indexNum(indexNum)
                .columnOrder(task.getColumnOrder())
                .title(task.getTitle())
                .tag(task.getProject() != null ? task.getProject().getName() : "General")
                .dueDateLabel(dueLabel)
                .dotColor(dot)
                .completed(task.getStatus() == TaskStatus.COMPLETED)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardSummary() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isEmpty() || userOpt.get().getActiveOrganizationId() == null) {
            throw new UnauthorizedException("Authentication required to access this resource");
        }
        UUID orgId = userOpt.get().getActiveOrganizationId();
        Organization organization = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
        User currentUser = userRepository.findById(userOpt.get().getId())
                .orElse(null);

        List<Project> orgProjects = projectRepository.findByOrganizationIdWithDetails(orgId);
        List<Task> orgTasks = taskRepository.findByOrganizationId(orgId, PageRequest.of(0, 500));

        long activeProjectsCount = orgProjects.stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                .count();

        long openTasksCount = orgTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getStatus() != TaskStatus.CANCELLED)
                .count();

        List<Map<String, Object>> projectList = orgProjects.stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId().toString());
                    map.put("name", p.getName());
                    map.put("status", p.getStatus() != null ? p.getStatus().name() : "ACTIVE");
                    return map;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> taskList = orgTasks.stream()
                .filter(t -> currentUser != null && t.getAssignee() != null && t.getAssignee().getId().equals(currentUser.getId()))
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId().toString());
                    map.put("title", t.getTitle());
                    map.put("status", t.getStatus() != null ? t.getStatus().name() : "TODO");
                    map.put("priority", t.getPriority() != null ? t.getPriority().name() : "MEDIUM");
                    return map;
                })
                .collect(Collectors.toList());

        Map<String, Object> data = new HashMap<>();
        data.put("userProfile", Map.of("activeOrganizationName", organization.getName()));
        data.put("kpis", Map.of(
                "activeProjects", activeProjectsCount,
                "openTasks", openTasksCount
        ));
        data.put("projects", projectList);
        data.put("myTasks", taskList);

        return data;
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            if (userOpt.get().getActiveOrganizationId() != null) {
                return organizationRepository.findById(userOpt.get().getActiveOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Active organization not found: " + userOpt.get().getActiveOrganizationId()));
            }
            throw new UnauthorizedException("User has no active organization");
        }
        List<Organization> orgs = organizationRepository.findAll();
        if (!orgs.isEmpty()) {
            return orgs.get(0);
        }
        Organization defaultOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Acme Co.")
                .status(OrganizationStatus.ACTIVE)
                .build();
        return organizationRepository.save(defaultOrg);
    }

    private User resolveCurrentUser(Organization org) {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            return userRepository.findById(userOpt.get().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userOpt.get().getId()));
        }
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }
        User defaultUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("SIVASURYA S")
                .email("admin@brick.local")
                .passwordHash("$2a$12$e0MYzXy/vP7J11.d3Jg1y.X9vG32g9J8qX8f0gK6hP2cQ3v5gK7a")
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(defaultUser);
    }
}
