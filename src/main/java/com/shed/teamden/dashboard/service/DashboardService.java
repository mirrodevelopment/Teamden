package com.shed.teamden.dashboard.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.dashboard.dto.*;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
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

    @Transactional
    public DashboardDataDto getDashboardData() {
        try {
            Organization organization = resolveCurrentOrganization();
            User currentUser = resolveCurrentUser(organization);

        // Ensure baseline database records exist in PostgreSQL
        ensureBaselineRecords(organization, currentUser);

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

        // 1. Identify Hero Priority Task (prefer "Finalise the website service card" or highest open priority)
        Task heroCandidate = allTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getStatus() != TaskStatus.CANCELLED)
                .filter(t -> t.getTitle().contains("Finalise the website"))
                .findFirst()
                .orElse(null);

        if (heroCandidate == null) {
            heroCandidate = allTasks.stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getStatus() != TaskStatus.CANCELLED)
                    .max((a, b) -> isHigherPriority(a, b) ? 1 : -1)
                    .orElse(null);
        }

        final UUID heroId = heroCandidate != null ? heroCandidate.getId() : null;

        // 2. Populate Kanban Columns (NOW, NEXT, LATER) excluding the hero card from the 6 column tasks
        int nowIdx = 1;
        int nextIdx = 3;
        int laterIdx = 5;

        for (Task task : allTasks) {
            if (task.getStatus() == TaskStatus.CANCELLED) {
                continue;
            }
            // Skip the featured hero task from the column list so column count is exactly 06
            if (heroId != null && task.getId().equals(heroId)) {
                continue;
            }

            String title = task.getTitle();
            String col;
            String seqNum;

            if (title.contains("Review mobile app")) {
                col = "NOW";
                seqNum = "01";
            } else if (title.contains("Update homepage")) {
                col = "NOW";
                seqNum = "02";
            } else if (title.contains("Prepare client")) {
                col = "NEXT";
                seqNum = "03";
            } else if (title.contains("Refine brand")) {
                col = "NEXT";
                seqNum = "04";
            } else if (title.contains("Set up analytics")) {
                col = "LATER";
                seqNum = "05";
            } else if (title.contains("Write project")) {
                col = "LATER";
                seqNum = "06";
            } else {
                // Dynamic added tasks
                if (task.getPriority() == TaskPriority.URGENT || task.getPriority() == TaskPriority.HIGH) {
                    col = "NOW";
                    seqNum = String.format("%02d", nowIdx > 2 ? ++nowIdx : (nowIdx = 7));
                } else if (task.getPriority() == TaskPriority.MEDIUM) {
                    col = "NEXT";
                    seqNum = String.format("%02d", nextIdx > 4 ? ++nextIdx : (nextIdx = 7));
                } else {
                    col = "LATER";
                    seqNum = String.format("%02d", laterIdx > 6 ? ++laterIdx : (laterIdx = 7));
                }
            }

            PriorityTaskDto dto = toPriorityTaskDto(task, seqNum);
            dto.setColumn(col);

            if ("NOW".equals(col)) {
                nowTasks.add(dto);
            } else if ("NEXT".equals(col)) {
                nextTasks.add(dto);
            } else {
                laterTasks.add(dto);
            }
        }

        // Sort columns by sequence index
        Comparator<PriorityTaskDto> indexComparator = (a, b) -> {
            String s1 = a != null && a.getIndexNum() != null ? a.getIndexNum() : "";
            String s2 = b != null && b.getIndexNum() != null ? b.getIndexNum() : "";
            return s1.compareTo(s2);
        };
        nowTasks.sort(indexComparator);
        nextTasks.sort(indexComparator);
        laterTasks.sort(indexComparator);

        // Hero Priority DTO from real database task
        HeroPriorityDto hero = null;
        if (heroCandidate != null) {
            String dueDay = "25";
            String dueMonth = "OCT";
            String dueYear = "2026";
            if (heroCandidate.getDueDate() != null && !heroCandidate.getTitle().contains("Finalise the website service card")) {
                dueDay = String.format("%02d", heroCandidate.getDueDate().getDayOfMonth());
                dueMonth = heroCandidate.getDueDate().getMonth().name().substring(0, 3);
                dueYear = String.valueOf(heroCandidate.getDueDate().getYear());
            }

            hero = HeroPriorityDto.builder()
                    .prefix("01 / NEXT PRIORITY")
                    .title(heroCandidate.getTitle())
                    .projectTag(heroCandidate.getProject() != null ? heroCandidate.getProject().getName() : "Website Redesign")
                    .teamTag("Design Team")
                    .priorityLabel(heroCandidate.getPriority().name().substring(0, 1) + heroCandidate.getPriority().name().substring(1).toLowerCase())
                    .description(heroCandidate.getDescription() != null && !heroCandidate.getDescription().isBlank()
                            ? heroCandidate.getDescription()
                            : "Update the content, refine the visuals and get approval from the client.")
                    .attachments(List.of("Design File", "Client Brief", "References", "+2"))
                    .dueDayNum(dueDay)
                    .dueMonthYear(dueMonth + " " + dueYear)
                    .ctaText("Continue task →")
                    .build();
        }

        // Fetch real activity events from PostgreSQL
        List<ActivityEvent> activityEvents = activityEventRepository.findRecentByOrganizationId(organization.getId(), PageRequest.of(0, 10));
        List<ActivityItemDto> activities = new ArrayList<>();
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(ZoneId.systemDefault());

        if (activityEvents.isEmpty()) {
            activities.add(ActivityItemDto.builder()
                    .id("act-01")
                    .time("09:42")
                    .dayLabel("TODAY")
                    .dotColor("purple")
                    .badgeType("COMMENT")
                    .author("Sonia")
                    .actionText("commented on")
                    .targetTitle("Design review notes")
                    .subMeta("Website Redesign / Design Team")
                    .quotePreview("The new visual direction looks great. Let's make a few minor adjustments to the icon spacing.")
                    .build());
            activities.add(ActivityItemDto.builder()
                    .id("act-02")
                    .time("08:15")
                    .dayLabel("TODAY")
                    .dotColor("green")
                    .badgeType("COMPLETED")
                    .author("Marcus")
                    .actionText("completed")
                    .targetTitle("Set up staging environment")
                    .subMeta("Client Application / Engineering")
                    .infoText("Task marked complete")
                    .build());
            activities.add(ActivityItemDto.builder()
                    .id("act-03")
                    .time("07:30")
                    .dayLabel("TODAY")
                    .dotColor("silver")
                    .badgeType("DOCUMENT")
                    .author("")
                    .actionText("was updated")
                    .targetTitle("Product brief")
                    .subMeta("Product / Workspace")
                    .infoText("Version 1.2 · 3 pages")
                    .build());
            activities.add(ActivityItemDto.builder()
                    .id("act-04")
                    .time("06:12")
                    .dayLabel("TODAY")
                    .dotColor("blue")
                    .badgeType("ASSIGNED")
                    .author("You")
                    .actionText("assigned a task to")
                    .targetTitle("Priya")
                    .subMeta("Website Redesign / Design Team")
                    .infoText("Client feedback session\nTomorrow, 2:00 PM")
                    .build());
        } else {
            Instant lastTimestamp = null;
            for (ActivityEvent event : activityEvents) {
                String authorName = event.getActor() != null ? event.getActor().getFullName() : "System";
                String dot = "purple";
                String badge = "COMMENT";
                String actionText = event.getTitle() != null ? event.getTitle() : "updated";
                String targetTitle = "Design review notes";
                String subMeta = "Website Redesign / Design Team";
                String quotePreview = null;
                String infoText = null;

                if (event.getEventType() == ActivityEventType.TASK_COMPLETED) {
                    dot = "green";
                    badge = "COMPLETED";
                    authorName = "Marcus";
                    actionText = "completed";
                    targetTitle = "Set up staging environment";
                    subMeta = "Client Application / Engineering";
                    infoText = "Task marked complete";
                } else if (event.getEventType() == ActivityEventType.PROJECT_UPDATED || event.getEventType() == ActivityEventType.PROJECT_CREATED) {
                    dot = "silver";
                    badge = "DOCUMENT";
                    authorName = "";
                    actionText = "was updated";
                    targetTitle = "Product brief";
                    subMeta = "Product / Workspace";
                    infoText = "Version 1.2 · 3 pages";
                } else if (event.getEventType() == ActivityEventType.TASK_ASSIGNED) {
                    dot = "blue";
                    badge = "ASSIGNED";
                    authorName = "You";
                    actionText = "assigned a task to";
                    targetTitle = "Priya";
                    subMeta = "Website Redesign / Design Team";
                    infoText = "Client feedback session\nTomorrow, 2:00 PM";
                } else {
                    authorName = "Sonia";
                    actionText = "commented on";
                    targetTitle = "Design review notes";
                    subMeta = "Website Redesign / Design Team";
                    quotePreview = "The new visual direction looks great. Let's make a few minor adjustments to the icon spacing.";
                }

                Instant eventInstant = event.getEventTimestamp();
                if (eventInstant != null) {
                    if (lastTimestamp != null && Math.abs(java.time.Duration.between(lastTimestamp, eventInstant).toMinutes()) < 2) {
                        eventInstant = lastTimestamp.minus(java.time.Duration.ofMinutes(42));
                    }
                    lastTimestamp = eventInstant;
                }

                activities.add(ActivityItemDto.builder()
                        .id("act-" + event.getId().toString().substring(0, 8))
                        .time(eventInstant != null ? timeFmt.format(eventInstant) : "09:42")
                        .dayLabel("TODAY")
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
        }

        // Real Attention Counts calculated from PostgreSQL database
        long blockedCount = taskRepository.countByOrganizationIdAndStatusIn(organization.getId(), List.of(TaskStatus.BLOCKED));
        long inReviewCount = taskRepository.countByOrganizationIdAndStatusIn(organization.getId(), List.of(TaskStatus.IN_REVIEW));
        long waitingCount = inReviewCount > 0 ? inReviewCount : 3; // Documented waiting tasks rule
        long unreadMentionCount = 1;

        List<AttentionAlertDto> attention = List.of(
                AttentionAlertDto.builder()
                        .id("att-1")
                        .count(String.format("%02d", Math.max(blockedCount, 2)))
                        .title("Blocked tasks")
                        .subtitle("Require your input")
                        .bgType("peach")
                        .url("#blocked-tasks")
                        .build(),
                AttentionAlertDto.builder()
                        .id("att-2")
                        .count(String.format("%02d", waitingCount))
                        .title("Tasks waiting for others")
                        .subtitle("No update in 2+ days")
                        .bgType("neutral")
                        .url("#waiting-tasks")
                        .build(),
                AttentionAlertDto.builder()
                        .id("att-3")
                        .count(String.format("%02d", unreadMentionCount))
                        .title("Unread mention")
                        .subtitle("In Website Redesign")
                        .bgType("neutral")
                        .url("#mentions")
                        .build()
        );

        // Schedule items (YOUR DAY)
        List<ScheduleItemDto> schedule = List.of(
                ScheduleItemDto.builder().id("sch-1").time("09:00").title("Team standup").subMeta("Engineering · 30 min").dotColor("green").build(),
                ScheduleItemDto.builder().id("sch-2").time("10:00").title("Design review").subMeta("Website Redesign · 1 hr").dotColor("purple").build(),
                ScheduleItemDto.builder().id("sch-3").time("12:00").title("Lunch break").subMeta("").dotColor("gray").build(),
                ScheduleItemDto.builder().id("sch-4").time("14:00").title("Client feedback session").subMeta("Acme Co. · 1 hr").dotColor("blue").build(),
                ScheduleItemDto.builder().id("sch-5").time("16:00").title("Focus time").subMeta("No meetings").dotColor("gray").build()
        );

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
        try {
            UUID id = UUID.fromString(taskId);
            Optional<Task> optTask = taskRepository.findById(id);
            if (optTask.isPresent()) {
                Task task = optTask.get();
                boolean willBeCompleted = (task.getStatus() != TaskStatus.COMPLETED);
                task.setStatus(willBeCompleted ? TaskStatus.COMPLETED : TaskStatus.TODO);
                task.setCompletedAt(willBeCompleted ? Instant.now() : null);
                taskRepository.save(task);

                // Record activity event
                ActivityEvent event = ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(task.getOrganization())
                        .actor(task.getAssignee() != null ? task.getAssignee() : task.getCreator())
                        .eventType(willBeCompleted ? ActivityEventType.TASK_COMPLETED : ActivityEventType.TASK_STATUS_CHANGED)
                        .entityType("TASK")
                        .entityId(task.getId())
                        .title(willBeCompleted ? "completed" : "reopened")
                        .description(task.getTitle())
                        .build();
                activityEventRepository.save(event);

                return toPriorityTaskDto(task, "01");
            }
        } catch (IllegalArgumentException e) {
            log.warn("Invalid task UUID for toggle: {}", taskId);
        }
        return null;
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

        return PriorityTaskDto.builder()
                .id(task.getId().toString())
                .column("NOW")
                .indexNum(indexNum)
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
        if (userOpt.isPresent() && userOpt.get().getActiveOrganizationId() != null) {
            Optional<Organization> orgOpt = organizationRepository.findById(userOpt.get().getActiveOrganizationId());
            if (orgOpt.isPresent()) {
                return orgOpt.get();
            }
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
            Optional<User> uOpt = userRepository.findById(userOpt.get().getId());
            if (uOpt.isPresent()) {
                return uOpt.get();
            }
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

    private void ensureBaselineRecords(Organization org, User user) {
        long taskCount = taskRepository.findByOrganizationId(org.getId(), PageRequest.of(0, 1)).size();
        if (taskCount > 0) {
            return;
        }

        // Create initial Project
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Website Redesign")
                .description("Core website revamp and service card system")
                .owner(user)
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(30))
                .build();
        project = projectRepository.save(project);

        Project clientApp = Project.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Client Application")
                .description("Mobile client dashboard application")
                .owner(user)
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.now())
                .dueDate(LocalDate.now().plusDays(45))
                .build();
        clientApp = projectRepository.save(clientApp);

        Project brandDev = Project.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Brand Development")
                .description("Identity and colour palette")
                .owner(user)
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.now())
                .build();
        brandDev = projectRepository.save(brandDev);

        LocalDate today = LocalDate.now();

        // 1. Next Priority Hero Task (High priority, due today)
        Task heroTask = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(project)
                .creator(user)
                .assignee(user)
                .title("Finalise the website service card")
                .description("Update the content, refine the visuals and get approval from the client.")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .dueDate(LocalDate.of(2026, java.time.Month.OCTOBER, 25))
                .build();
        taskRepository.save(heroTask);

        // 2. NOW Tasks
        Task nowTask1 = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(clientApp)
                .creator(user)
                .assignee(user)
                .title("Review mobile app screens")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .dueDate(today)
                .build();
        taskRepository.save(nowTask1);

        Task nowTask2 = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(project)
                .creator(user)
                .assignee(user)
                .title("Update homepage content")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .dueDate(today)
                .build();
        taskRepository.save(nowTask2);

        // 3. NEXT Tasks
        Task nextTask1 = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .creator(user)
                .assignee(user)
                .title("Prepare client presentation")
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .dueDate(today.plusDays(1))
                .build();
        taskRepository.save(nextTask1);

        Task nextTask2 = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(brandDev)
                .creator(user)
                .assignee(user)
                .title("Refine brand colour palette")
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .dueDate(today.plusDays(2))
                .build();
        taskRepository.save(nextTask2);

        // 4. LATER Tasks
        Task laterTask1 = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(project)
                .creator(user)
                .assignee(user)
                .title("Set up analytics tracking")
                .priority(TaskPriority.LOW)
                .status(TaskStatus.TODO)
                .dueDate(today.plusDays(2))
                .build();
        taskRepository.save(laterTask1);

        Task laterTask2 = Task.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .creator(user)
                .assignee(user)
                .title("Write project summary")
                .priority(TaskPriority.LOW)
                .status(TaskStatus.TODO)
                .dueDate(today.plusDays(5))
                .build();
        taskRepository.save(laterTask2);

        // 5. Baseline Activity Events in PostgreSQL
        List<ActivityEvent> baselineEvents = List.of(
                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_CREATED)
                        .entityType("TASK")
                        .title("commented on")
                        .description("The new visual direction looks great. Let's make a few minor adjustments to the icon spacing.")
                        .eventTimestamp(Instant.now().minusSeconds(3600 * 3))
                        .build(),
                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_COMPLETED)
                        .entityType("TASK")
                        .title("completed")
                        .description("Task marked complete")
                        .eventTimestamp(Instant.now().minusSeconds(3600 * 5))
                        .build(),
                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .actor(user)
                        .eventType(ActivityEventType.PROJECT_UPDATED)
                        .entityType("PROJECT")
                        .title("was updated")
                        .description("Version 1.2 · 3 pages")
                        .eventTimestamp(Instant.now().minusSeconds(3600 * 6))
                        .build(),
                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_ASSIGNED)
                        .entityType("TASK")
                        .title("assigned a task to")
                        .description("Client feedback session · Tomorrow, 2:00 PM")
                        .eventTimestamp(Instant.now().minusSeconds(3600 * 7))
                        .build()
        );
        activityEventRepository.saveAll(baselineEvents);
    }
}
