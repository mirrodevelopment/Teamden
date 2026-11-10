package com.shed.teamden.task.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.dashboard.dto.PriorityTaskDto;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.dto.CreateTaskRequestDto;
import com.shed.teamden.task.dto.TaskOptionsDto;
import com.shed.teamden.task.entity.KanbanColumn;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final ActivityEventRepository activityEventRepository;

    @Transactional
    public PriorityTaskDto createTask(CreateTaskRequestDto request) {
        if (request == null || request.getTitle() == null || request.getTitle().trim().isBlank()) {
            throw new BadRequestException("Task title is required");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        // 1. Resolve Kanban Column
        KanbanColumn column = KanbanColumn.NOW;
        if (request.getColumn() != null && !request.getColumn().isBlank()) {
            try {
                column = KanbanColumn.fromString(request.getColumn().trim());
            } catch (Exception e) {
                column = KanbanColumn.NOW;
            }
        }

        // 2. Resolve Priority
        TaskPriority priority = TaskPriority.MEDIUM;
        if (request.getPriority() != null && !request.getPriority().isBlank()) {
            try {
                priority = TaskPriority.valueOf(request.getPriority().trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                priority = (column == KanbanColumn.NOW) ? TaskPriority.HIGH : TaskPriority.MEDIUM;
            }
        } else {
            if (column == KanbanColumn.NOW)
                priority = TaskPriority.HIGH;
            else if (column == KanbanColumn.LATER)
                priority = TaskPriority.LOW;
        }

        // 3. Resolve Due Date
        LocalDate dueDate = request.getDueDate();
        if (dueDate == null) {
            LocalDate today = LocalDate.now();
            if (column == KanbanColumn.NOW) {
                dueDate = today;
            } else if (column == KanbanColumn.NEXT) {
                dueDate = today.plusDays(1);
            } else {
                dueDate = today.plusDays(7);
            }
        }

        // 4. Resolve Project (validating multi-tenant isolation)
        Project project = null;
        if (request.getProjectId() != null) {
            Optional<Project> projOpt = projectRepository.findById(request.getProjectId());
            if (projOpt.isEmpty() || !projOpt.get().getOrganization().getId().equals(organization.getId())) {
                throw new BadRequestException("Project not found in this organization");
            }
            project = projOpt.get();
        } else if (request.getProjectTag() != null && !request.getProjectTag().trim().isBlank()
                && !"General".equalsIgnoreCase(request.getProjectTag().trim())) {
            String tagName = request.getProjectTag().trim();
            List<Project> existingProjects = projectRepository.findByOrganizationIdWithDetails(organization.getId());
            project = existingProjects.stream()
                    .filter(p -> p.getName().equalsIgnoreCase(tagName))
                    .findFirst()
                    .orElse(null);
            if (project == null) {
                project = Project.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .name(tagName)
                        .owner(currentUser)
                        .status(ProjectStatus.ACTIVE)
                        .startDate(LocalDate.now())
                        .build();
                project = projectRepository.save(project);
            }
        }

        // 5. Resolve Assignee
        User assignee = currentUser;
        if (request.getAssigneeId() != null) {
            Optional<OrganizationMembership> memOpt = membershipRepository
                    .findByOrganizationIdAndUserId(organization.getId(), request.getAssigneeId());
            if (memOpt.isEmpty()) {
                throw new BadRequestException("Assignee does not belong to this organization");
            }
            assignee = userRepository.findById(request.getAssigneeId()).orElse(currentUser);
        }

        // 6. Compute column order
        int nextOrder = taskRepository.findMaxColumnOrderByOrganizationIdAndKanbanColumn(organization.getId(), column)
                + 1;

        // 7. Persist Task
        Task task = Task.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .project(project)
                .creator(currentUser)
                .assignee(assignee)
                .title(request.getTitle().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .priority(priority)
                .status(TaskStatus.TODO)
                .kanbanColumn(column)
                .columnOrder(nextOrder)
                .dueDate(dueDate)
                .build();

        task = taskRepository.save(task);

        // 8. Record Activity Event in PostgreSQL
        String dot = (priority == TaskPriority.HIGH || priority == TaskPriority.URGENT) ? "red"
                : (priority == TaskPriority.MEDIUM ? "orange" : "blue");
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(currentUser)
                .eventType(ActivityEventType.TASK_CREATED)
                .entityType("TASK")
                .entityId(task.getId())
                .title("created task")
                .description(task.getTitle())
                .actionText("created task")
                .targetTitle(task.getTitle())
                .subMeta(project != null ? project.getName() : "Workspace / General")
                .badgeType("ASSIGNED")
                .dotColor(dot)
                .eventTimestamp(Instant.now())
                .build();
        activityEventRepository.save(event);

        log.info("Successfully created task '{}' ({}) in org {}", task.getTitle(), task.getId(), organization.getId());
        return toPriorityTaskDto(task, "01");
    }

    @Transactional(readOnly = true)
    public TaskOptionsDto getTaskOptions() {
        Organization organization = resolveCurrentOrganization();

        // 1. Projects
        List<Project> projects = projectRepository.findByOrganizationIdWithDetails(organization.getId());
        List<TaskOptionsDto.ProjectOptionDto> projectDtos = projects.stream()
                .map(p -> TaskOptionsDto.ProjectOptionDto.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .description(p.getDescription())
                        .build())
                .toList();

        // 2. Active Organization Members
        List<OrganizationMembership> memberships = membershipRepository
                .findByOrganizationIdAndStatusWithUser(organization.getId(), MembershipStatus.ACTIVE);
        List<TaskOptionsDto.AssigneeOptionDto> assigneeDtos = memberships.stream()
                .map(m -> {
                    User u = m.getUser();
                    String fullName = (u != null && u.getFullName() != null) ? u.getFullName() : "Member";
                    String[] parts = fullName.trim().split("\\s+");
                    String initials = parts.length > 1
                            ? ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                            : (fullName.length() > 0
                                    ? fullName.substring(0, Math.min(2, fullName.length())).toUpperCase()
                                    : "TM");
                    return TaskOptionsDto.AssigneeOptionDto.builder()
                            .id(u != null ? u.getId() : m.getId())
                            .name(fullName)
                            .email(u != null ? u.getEmail() : "")
                            .role(m.getRole() != null ? m.getRole().name() : "MEMBER")
                            .initials(initials)
                            .build();
                })
                .toList();

        return TaskOptionsDto.builder()
                .projects(projectDtos)
                .assignees(assigneeDtos)
                .columns(List.of("NOW", "NEXT", "LATER"))
                .priorities(List.of("HIGH", "MEDIUM", "LOW", "URGENT"))
                .build();
    }

    @Transactional(readOnly = true)
    public List<PriorityTaskDto> getTasks(String column) {
        Organization organization = resolveCurrentOrganization();
        List<Task> all = taskRepository.findByOrganizationId(organization.getId(), PageRequest.of(0, 100));
        int seq = 1;
        List<PriorityTaskDto> dtos = new ArrayList<>();
        for (Task t : all) {
            if (column == null || column.isBlank()
                    || (t.getKanbanColumn() != null && t.getKanbanColumn().name().equalsIgnoreCase(column))) {
                dtos.add(toPriorityTaskDto(t, String.format("%02d", seq++)));
            }
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public PriorityTaskDto getTaskById(UUID taskId) {
        Organization organization = resolveCurrentOrganization();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        if (!task.getOrganization().getId().equals(organization.getId())) {
            throw new BadRequestException("Task does not belong to the active organization");
        }
        return toPriorityTaskDto(task, "01");
    }

    public PriorityTaskDto toPriorityTaskDto(Task task, String indexNum) {
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

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            if (userOpt.get().getActiveOrganizationId() != null) {
                return organizationRepository.findById(userOpt.get().getActiveOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Active organization not found: " + userOpt.get().getActiveOrganizationId()));
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
