package com.shed.teamden.project.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.dto.*;
import com.shed.teamden.project.entity.*;
import com.shed.teamden.project.repository.*;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final ProjectSpecificationRepository projectSpecificationRepository;
    private final ProjectDecisionRepository projectDecisionRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskRepository taskRepository;
    private final ActivityEventRepository activityEventRepository;

    public ProjectService(ProjectRepository projectRepository,
                          OrganizationRepository organizationRepository,
                          UserRepository userRepository,
                          ProjectMilestoneRepository projectMilestoneRepository,
                          ProjectSpecificationRepository projectSpecificationRepository,
                          ProjectDecisionRepository projectDecisionRepository,
                          ProjectDocumentRepository projectDocumentRepository,
                          ProjectMemberRepository projectMemberRepository,
                          TaskRepository taskRepository,
                          ActivityEventRepository activityEventRepository) {
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.projectMilestoneRepository = projectMilestoneRepository;
        this.projectSpecificationRepository = projectSpecificationRepository;
        this.projectDecisionRepository = projectDecisionRepository;
        this.projectDocumentRepository = projectDocumentRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.taskRepository = taskRepository;
        this.activityEventRepository = activityEventRepository;
    }

    @Transactional
    public ProjectDashboardDto getProjectDashboardData() {
        try {
            Organization organization = resolveCurrentOrganization();
            User currentUser = resolveCurrentUser(organization);

            List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(organization.getId());

            LocalDate today = LocalDate.now();
            String dayOfWeek = today.getDayOfWeek().name().substring(0, 3);
            String month = today.getMonth().name().substring(0, 3);
            String year = String.valueOf(today.getYear());
            String dayNum = String.format("%02d", today.getDayOfMonth());
            String formattedDate = dayOfWeek + ", " + dayNum + " " + month + " " + year;

            long totalCount = allProjects.size();
            long activeCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
            long atRiskCount = allProjects.stream().filter(p -> "AT_RISK".equalsIgnoreCase(p.getHealth())).count();
            long dueSoonCount = allProjects.stream()
                    .filter(p -> p.getDueDate() != null && !p.getDueDate().isBefore(today) && p.getDueDate().isBefore(today.plusDays(7)) && p.getStatus() != ProjectStatus.COMPLETED)
                    .count();

            ProjectItemDto featured = null;
            List<ProjectItemDto> projectDtos = new ArrayList<>();
            List<DecisionItemDto> decisions = new ArrayList<>();
            List<ProjectAttentionDto> attention = new ArrayList<>();
            List<UpcomingMilestoneDto> milestones = new ArrayList<>();

            int pIdx = 1;
            for (Project p : allProjects) {
                String stat = p.getStatus() != null ? p.getStatus().name() : "ACTIVE";
                String statLbl = stat.replace("_", " ");
                String dueLbl = p.getDueDate() != null ? "Due " + p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "Upcoming";
                String health = p.getHealth() != null ? p.getHealth() : "ON_TRACK";
                String healthLbl = health.replace("_", " ");
                String healthDot = "AT_RISK".equalsIgnoreCase(health) ? "red" : "green";

                List<ProjectMilestone> pMilestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(p.getId());
                long completedM = pMilestones.stream().filter(m -> m.getStatus() == MilestoneStatus.COMPLETED).count();
                String mLabel = pMilestones.isEmpty() ? "0 milestones" : String.format("%02d/%02d", completedM, pMilestones.size());

                List<Task> pTasks = taskRepository.findByProjectIdWithDetails(p.getId());
                long blockers = pTasks.stream().filter(t -> t != null && t.isBlocked()).count();

                String ownerName = p.getOwner() != null ? p.getOwner().getFullName() : "Team";
                String[] parts = ownerName.trim().split("\\s+");
                String initials = parts.length > 1
                        ? ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
                        : (ownerName.length() > 0 ? ownerName.substring(0, Math.min(2, ownerName.length())).toUpperCase() : "TM");

                ProjectItemDto dto = ProjectItemDto.builder()
                        .id(p.getId().toString())
                        .indexNum(String.format("%02d", pIdx++))
                        .name(p.getName())
                        .description(p.getDescription() != null ? p.getDescription() : "Project workspace")
                        .status(stat)
                        .statusLabel(statLbl)
                        .statusDotColor(stat.equals("ACTIVE") ? "green" : stat.equals("COMPLETED") ? "blue" : "gray")
                        .health(health)
                        .healthLabel(healthLbl)
                        .healthDotColor(healthDot)
                        .team(ownerName)
                        .dueDate(dueLbl)
                        .priority(p.getPriority() != null ? p.getPriority() : "Medium")
                        .milestonesLabel(mLabel)
                        .milestonesCompleted((int) completedM)
                        .milestonesTotal(pMilestones.size())
                        .blockersCount((int) blockers)
                        .avatars(List.of(initials))
                        .avatarOverflow("")
                        .build();

                if (featured == null) {
                    featured = dto;
                }
                projectDtos.add(dto);

                // Decisions
                List<ProjectDecision> pDecisions = projectDecisionRepository.findByProjectIdWithDecider(p.getId());
                for (ProjectDecision d : pDecisions) {
                    if (d.getStatus() == DecisionStatus.PENDING && decisions.size() < 5) {
                        decisions.add(DecisionItemDto.builder()
                                .id(d.getId().toString())
                                .projectTag(p.getName().toUpperCase())
                                .title(d.getTitle())
                                .subTitle(d.getSubTitle() != null ? d.getSubTitle() : "Review required")
                                .dueDate(d.getDueDate() != null ? "Due " + d.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "Pending")
                                .indicatorColor("amber")
                                .hasAction(true)
                                .actionLabel("Review →")
                                .build());
                    }
                }

                // Blockers attention
                if (blockers > 0 && attention.size() < 5) {
                    attention.add(ProjectAttentionDto.builder()
                            .id("att-" + p.getId().toString().substring(0, 4))
                            .indexNum(String.format("%02d", attention.size() + 1))
                            .statusType("BLOCKED")
                            .statusDot("red")
                            .metaLabel(blockers + (blockers == 1 ? " blocker" : " blockers"))
                            .projectName(p.getName())
                            .detail(blockers + " blockers require input")
                            .dateLabel(p.getDueDate() != null ? "Due " + p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "Active")
                            .build());
                }

                // Upcoming milestones
                for (ProjectMilestone m : pMilestones) {
                    if (m.getStatus() != MilestoneStatus.COMPLETED && milestones.size() < 5) {
                        String mDate = m.getDueDate() != null ? m.getDueDate().format(DateTimeFormatter.ofPattern("dd MMM")).toUpperCase() : "TBD";
                        milestones.add(UpcomingMilestoneDto.builder()
                                .id(m.getId().toString())
                                .dateDayMonth(mDate)
                                .dotColor(m.getStatus() == MilestoneStatus.CURRENT ? "green" : "amber")
                                .title(p.getName())
                                .subTitle(m.getName())
                                .build());
                    }
                }
            }

            return ProjectDashboardDto.builder()
                    .workspaceBreadcrumb("YOUR WORKSPACE / 02")
                    .currentDateLabel(formattedDate)
                    .totalProjects(totalCount)
                    .activeCount(activeCount)
                    .atRiskCount(atRiskCount)
                    .dueSoonCount(dueSoonCount)
                    .featuredProject(featured)
                    .projects(projectDtos)
                    .decisionsRequired(decisions)
                    .projectAttention(attention)
                    .upcomingMilestones(milestones)
                    .build();

        } catch (Throwable t) {
            log.error("Error generating projects dashboard data: {}", t.getMessage(), t);
            throw new RuntimeException("Failed to load project dashboard data: " + t.getMessage(), t);
        }
    }

    @Transactional
    public ProjectItemDto createProject(CreateProjectRequestDto req) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        ProjectStatus status = ProjectStatus.ACTIVE;
        if (req.getStatus() != null) {
            try {
                status = ProjectStatus.valueOf(req.getStatus().toUpperCase());
            } catch (Exception ignored) {}
        }

        LocalDate due = null;
        if (req.getDueDate() != null && !req.getDueDate().isBlank()) {
            try {
                due = LocalDate.parse(req.getDueDate());
            } catch (Exception ignored) {}
        }

        Project newProject = Project.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .name(req.getName() != null && !req.getName().isBlank() ? req.getName().trim() : "Untitled Project")
                .description(req.getDescription())
                .owner(currentUser)
                .status(status)
                .health("ON_TRACK")
                .priority("MEDIUM")
                .projectType("General")
                .startDate(LocalDate.now())
                .dueDate(due != null ? due : LocalDate.now().plusDays(30))
                .build();

        newProject = projectRepository.save(newProject);
        ensureProjectFlowBaseline(newProject, currentUser);

        String dueStr = newProject.getDueDate() != null
                ? "Due " + newProject.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy"))
                : "Upcoming";

        return ProjectItemDto.builder()
                .id(newProject.getId().toString())
                .indexNum("08")
                .name(newProject.getName())
                .description(newProject.getDescription())
                .status(newProject.getStatus().name())
                .statusLabel(newProject.getStatus().name().replace("_", " "))
                .statusDotColor("green")
                .health("ON_TRACK")
                .healthLabel("ON TRACK")
                .healthDotColor("green")
                .team(currentUser.getFullName())
                .dueDate(dueStr)
                .milestonesLabel("0/9 milestones")
                .milestonesCompleted(0)
                .milestonesTotal(9)
                .avatars(List.of("ME"))
                .avatarOverflow("")
                .build();
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

    private Project resolveProject(String projectId) {
        Organization org = resolveCurrentOrganization();
        if (projectId != null && !projectId.isBlank() && !projectId.equalsIgnoreCase("featured-01")) {
            UUID uuid;
            try {
                uuid = UUID.fromString(projectId.trim());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid project ID format: " + projectId);
            }
            Project project = projectRepository.findById(uuid)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

            if (!project.getOrganization().getId().equals(org.getId())) {
                throw new BadRequestException("Project not found in this organization");
            }
            return project;
        }

        List<Project> orgProjects = projectRepository.findByOrganizationIdWithDetails(org.getId());
        if (!orgProjects.isEmpty()) {
            return orgProjects.stream()
                    .filter(p -> p.getName().equalsIgnoreCase("Website Redesign"))
                    .findFirst()
                    .orElse(orgProjects.get(0));
        }
        return null;
    }

    @Transactional
    public ProjectOverviewDto getProjectOverview(String projectId) {
        Project project = resolveProject(projectId);
        if (project == null) {
            return ProjectOverviewDto.createDefault(projectId, "Website Redesign", "Redesign the website into a responsive, modern experience.", "Design Team", "15 Nov 2026", "ACTIVE");
        }

        // Milestones
        List<ProjectMilestone> milestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(project.getId());
        int milestonesTotal = milestones.size();
        int milestonesCompleted = (int) milestones.stream().filter(m -> m.getStatus() == MilestoneStatus.COMPLETED).count();
        String milestonesSummary = String.format("%02d/%02d COMPLETED", milestonesCompleted, milestonesTotal);

        List<ProjectOverviewDto.MilestoneStageDto> milestoneDtos = milestones.stream().map(m ->
                ProjectOverviewDto.MilestoneStageDto.builder()
                        .id(m.getId().toString())
                        .seqNum(String.format("%02d", m.getSeqNum()))
                        .name(m.getName())
                        .status(m.getStatus().name())
                        .statusLabel(m.getStatusLabel() != null ? m.getStatusLabel() : m.getStatus().name())
                        .build()
        ).toList();

        // Specification
        Optional<ProjectSpecification> specOpt = projectSpecificationRepository.findByProjectId(project.getId());
        ProjectOverviewDto.SpecificationDto specDto;
        if (specOpt.isPresent()) {
            ProjectSpecification spec = specOpt.get();
            List<String> objectives = spec.getObjectives() != null ? Arrays.asList(spec.getObjectives().split("\\r?\\n")) : List.of();
            List<String> deliverables = spec.getDeliverables() != null ? Arrays.asList(spec.getDeliverables().split("\\r?\\n")) : List.of();
            List<String> successCriteria = spec.getSuccessCriteria() != null ? Arrays.asList(spec.getSuccessCriteria().split("\\r?\\n")) : List.of();
            specDto = ProjectOverviewDto.SpecificationDto.builder()
                    .title(spec.getTitle())
                    .objectives(objectives)
                    .deliverables(deliverables)
                    .successCriteria(successCriteria)
                    .projectContext(Map.of(
                            "Client", spec.getClientName() != null ? spec.getClientName() : "Acme Co.",
                            "Type", project.getProjectType() != null ? project.getProjectType() : "Design / Development",
                            "Focus", spec.getFocusArea() != null ? spec.getFocusArea() : "Brand, performance and growth"
                    ))
                    .build();
        } else {
            specDto = ProjectOverviewDto.SpecificationDto.builder()
                    .title("Build a better digital experience.")
                    .objectives(List.of("Improve user experience", "Increase conversion rate"))
                    .deliverables(List.of("Responsive website", "CMS implementation"))
                    .successCriteria(List.of("Higher engagement", "Increased conversion rate"))
                    .projectContext(Map.of("Client", "Acme Co.", "Type", "Design / Development", "Focus", "Growth"))
                    .build();
        }

        // Tasks & Work in Motion
        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
        long todoCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.TODO).count();
        long inProgCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long inRevCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_REVIEW).count();
        long blockedCount = tasks.stream().filter(t -> t != null && t.isBlocked()).count();

        List<ProjectOverviewDto.WorkStatusCardDto> workCards = List.of(
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("TODO")
                        .statusLabel("TO DO")
                        .dotColor("gray")
                        .count(String.format("%02d", todoCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.TODO).findFirst().map(t -> t.getTitle()).orElse("Prepare responsive layouts"))
                        .assigneeAvatar("AR")
                        .build(),
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("IN_PROGRESS")
                        .statusLabel("IN PROGRESS")
                        .dotColor("amber")
                        .count(String.format("%02d", inProgCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_PROGRESS).findFirst().map(t -> t.getTitle()).orElse("Homepage development"))
                        .assigneeAvatar("MJ")
                        .build(),
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("IN_REVIEW")
                        .statusLabel("IN REVIEW")
                        .dotColor("blue")
                        .count(String.format("%02d", inRevCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_REVIEW).findFirst().map(t -> t.getTitle()).orElse("Design system review"))
                        .assigneeAvatar("SK")
                        .build(),
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("BLOCKED")
                        .statusLabel("BLOCKED")
                        .dotColor("red")
                        .count(String.format("%02d", blockedCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.isBlocked()).findFirst().map(t -> t.getTitle()).orElse("Client copy approval"))
                        .assigneeAvatar("PK")
                        .build()
        );

        // Documents
        List<ProjectDocument> docs = projectDocumentRepository.findByProjectIdWithAuthor(project.getId());
        List<ProjectOverviewDto.ProjectDocumentDto> docDtos = docs.stream().map(d ->
                ProjectOverviewDto.ProjectDocumentDto.builder()
                        .name(d.getTitle())
                        .fileType(d.getFileType())
                        .fileSize(d.getFileSize() != null ? d.getFileSize() : "1.2 MB")
                        .iconType(d.getFileType().toLowerCase())
                        .build()
        ).toList();

        // Decisions
        List<ProjectDecision> decisions = projectDecisionRepository.findByProjectIdWithDecider(project.getId());
        Optional<ProjectDecision> firstPending = decisions.stream().filter(d -> d.getStatus() == DecisionStatus.PENDING).findFirst();
        ProjectOverviewDto.PendingDecisionDto pendingDecisionDto = null;
        if (firstPending.isPresent()) {
            ProjectDecision dec = firstPending.get();
            String ownerName = dec.getDecider() != null ? dec.getDecider().getFullName() : "Lead Reviewer";
            String[] parts = ownerName.trim().split("\\s+");
            String initials = parts.length > 1 ? ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : ownerName.substring(0, Math.min(2, ownerName.length())).toUpperCase();
            String dueLbl = dec.getDueDate() != null ? dec.getDueDate().format(DateTimeFormatter.ofPattern("d MMM")) : "Soon";
            pendingDecisionDto = ProjectOverviewDto.PendingDecisionDto.builder()
                    .title(dec.getTitle())
                    .description(dec.getDescription() != null ? dec.getDescription() : "Decision awaiting review.")
                    .statusLabel("Awaiting Your Review")
                    .dueDateLabel(dueLbl)
                    .ownerName(ownerName)
                    .ownerInitials(initials)
                    .build();
        }

        // Members
        List<ProjectMember> members = projectMemberRepository.findByProjectIdWithUser(project.getId());
        List<String> memberInitials = new ArrayList<>();
        for (ProjectMember m : members) {
            if (m.getUser() != null) {
                String name = m.getUser().getFullName();
                String[] parts = name.trim().split("\\s+");
                String init = parts.length > 1 ? ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : name.substring(0, Math.min(2, name.length())).toUpperCase();
                memberInitials.add(init);
            }
        }
        if (memberInitials.isEmpty()) {
            memberInitials = List.of("PK", "AR", "SK", "MJ");
        }

        String dueStr = project.getDueDate() != null ? project.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "15 Nov 2026";
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : "Design Team";

        return ProjectOverviewDto.builder()
                .id(project.getId().toString())
                .breadcrumb("PROJECTS / 02 / " + project.getName().toUpperCase())
                .title(project.getName())
                .description(project.getDescription() != null ? project.getDescription() : "Project workspace")
                .owner(ownerStr)
                .dueDate(dueStr)
                .projectType(project.getProjectType() != null ? project.getProjectType() : "Design / Development")
                .health(project.getHealth().equals("AT_RISK") ? "At Risk" : "On Track")
                .healthDotColor(project.getHealth().equals("AT_RISK") ? "orange" : "green")
                .status(project.getStatus() != null ? project.getStatus().name() : "Active")
                .statusDotColor("green")
                .specification(specDto)
                .milestonesSummary(milestonesSummary)
                .milestonesCompleted(milestonesCompleted)
                .milestonesTotal(milestonesTotal)
                .milestonesList(milestoneDtos)
                .workInMotion(workCards)
                .knowledgeDocuments(docDtos)
                .unresolvedBlockersCount((int) blockedCount)
                .healthHeading("Unresolved blockers")
                .healthDescription(blockedCount + " issues need attention before the next milestone.")
                .pendingDecision(pendingDecisionDto)
                .moreDecisionsCount(Math.max(0, decisions.size() - 1))
                .teamMemberInitials(memberInitials)
                .totalTeamMembers(Math.max(memberInitials.size(), 4))
                .build();
    }

    @Transactional
    public ProjectTasksDto getProjectTasks(String projectId) {
        Project project = resolveProject(projectId);
        if (project == null) {
            return ProjectTasksDto.createDefault(projectId, "website redesign.", "Design Team", "15 Nov 2026", "ACTIVE");
        }

        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
        List<ProjectMilestone> milestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(project.getId());

        int totalTasks = tasks.size();
        long todoCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long inRevCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_REVIEW).count();
        long completedCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.COMPLETED).count();
        long blockedCount = tasks.stream().filter(t -> t != null && t.isBlocked()).count();

        ProjectTasksDto.WorkStatusSummaryDto workStatus = ProjectTasksDto.WorkStatusSummaryDto.builder()
                .totalTasks(totalTasks)
                .todoCount((int) todoCount)
                .todoPercent(totalTasks > 0 ? (todoCount * 100 / totalTasks) + "%" : "0%")
                .inProgressCount((int) inProgCount)
                .inProgressPercent(totalTasks > 0 ? (inProgCount * 100 / totalTasks) + "%" : "0%")
                .inReviewCount((int) inRevCount)
                .inReviewPercent(totalTasks > 0 ? (inRevCount * 100 / totalTasks) + "%" : "0%")
                .completedCount((int) completedCount)
                .completedPercent(totalTasks > 0 ? (completedCount * 100 / totalTasks) + "%" : "0%")
                .blockedCount((int) blockedCount)
                .blockedSubtitle("of " + totalTasks + " tasks")
                .build();

        List<ProjectTasksDto.TaskItemDto> inProgressItems = tasks.stream()
                .filter(t -> t != null && t.getStatus() == TaskStatus.IN_PROGRESS)
                .map(this::mapToTaskItemDto)
                .toList();

        List<ProjectTasksDto.TaskItemDto> todoItems = tasks.stream()
                .filter(t -> t != null && t.getStatus() == TaskStatus.TODO)
                .map(this::mapToTaskItemDto)
                .toList();

        List<ProjectTasksDto.TaskItemDto> inReviewItems = tasks.stream()
                .filter(t -> t != null && t.getStatus() == TaskStatus.IN_REVIEW)
                .map(this::mapToTaskItemDto)
                .toList();

        List<ProjectTasksDto.TaskItemDto> completedItems = tasks.stream()
                .filter(t -> t != null && t.getStatus() == TaskStatus.COMPLETED)
                .map(this::mapToTaskItemDto)
                .toList();

        List<ProjectTasksDto.TaskGroupDto> taskGroups = List.of(
                ProjectTasksDto.TaskGroupDto.builder().key("in_progress").label("In Progress").count(inProgressItems.size()).dotColor("amber").isExpanded(true).tasks(inProgressItems).build(),
                ProjectTasksDto.TaskGroupDto.builder().key("todo").label("To Do").count(todoItems.size()).dotColor("gray").isExpanded(false).tasks(todoItems).build(),
                ProjectTasksDto.TaskGroupDto.builder().key("in_review").label("In Review").count(inReviewItems.size()).dotColor("blue").isExpanded(false).tasks(inReviewItems).build(),
                ProjectTasksDto.TaskGroupDto.builder().key("completed").label("Completed").count(completedItems.size()).dotColor("green").isCheckIcon(true).isExpanded(false).tasks(completedItems).build()
        );

        List<ProjectTasksDto.BlockedTaskDto> blockedList = tasks.stream()
                .filter(t -> t != null && t.isBlocked())
                .map(t -> ProjectTasksDto.BlockedTaskDto.builder()
                        .id(t.getTaskCode() != null ? t.getTaskCode() : "T-" + t.getId().toString().substring(0, 4))
                        .title(t.getTitle())
                        .reason(t.getBlockerReason() != null ? t.getBlockerReason() : "Awaiting input")
                        .build()
                ).toList();

        ProjectMilestone currMilestone = milestones.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.CURRENT)
                .findFirst()
                .orElse(milestones.isEmpty() ? null : milestones.get(0));

        ProjectTasksDto.CurrentMilestoneDto currDto = null;
        if (currMilestone != null) {
            currDto = ProjectTasksDto.CurrentMilestoneDto.builder()
                    .number("Milestone " + currMilestone.getCode())
                    .name(currMilestone.getName())
                    .activeTasksCount((int) inProgCount)
                    .blockedTasksCount((int) blockedCount)
                    .progressPercent(65)
                    .build();
        }

        List<ProjectTasksDto.MilestoneSummaryDto> byMilestone = milestones.stream().map(m -> {
            long count = tasks.stream().filter(t -> t.getMilestone() != null && t.getMilestone().getId().equals(m.getId())).count();
            return ProjectTasksDto.MilestoneSummaryDto.builder()
                    .num(m.getCode())
                    .title(m.getName())
                    .count((int) count)
                    .isActive(m.getStatus() == MilestoneStatus.CURRENT)
                    .build();
        }).toList();

        String dueStr = project.getDueDate() != null ? project.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "15 Nov 2026";
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : "Design Team";

        return ProjectTasksDto.builder()
                .id(project.getId().toString())
                .breadcrumb("PROJECTS / 02 / " + project.getName().toUpperCase())
                .title(project.getName())
                .owner(ownerStr)
                .dueDate(dueStr)
                .status(project.getStatus() != null ? project.getStatus().name() : "Active")
                .workStatus(workStatus)
                .taskGroups(taskGroups)
                .currentMilestone(currDto)
                .blockedTasks(blockedList)
                .tasksByMilestone(byMilestone)
                .linkedKnowledge(List.of(
                        ProjectTasksDto.KnowledgeDocDto.builder().title("Design Review Notes").linkedTasksCount(2).icon("file").build(),
                        ProjectTasksDto.KnowledgeDocDto.builder().title("Project Brief").linkedTasksCount(1).icon("file").build(),
                        ProjectTasksDto.KnowledgeDocDto.builder().title("Design Guidelines").linkedTasksCount(3).icon("link").build()
                ))
                .quickActions(List.of(
                        ProjectTasksDto.QuickActionDto.builder().actionKey("add_task").title("Add new task").icon("plus").build(),
                        ProjectTasksDto.QuickActionDto.builder().actionKey("filter_mine").title("Filter my tasks").icon("filter").build()
                ))
                .build();
    }

    private ProjectTasksDto.TaskItemDto mapToTaskItemDto(Task t) {
        String milestoneName = t.getMilestone() != null ? "Milestone " + t.getMilestone().getCode() : "General";
        String assigneeName = t.getAssignee() != null ? t.getAssignee().getFullName() : "Unassigned";
        String[] parts = assigneeName.trim().split("\\s+");
        String initials = parts.length > 1 ? ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase() : assigneeName.substring(0, Math.min(2, assigneeName.length())).toUpperCase();
        String dueStr = t.getDueDate() != null ? t.getDueDate().format(DateTimeFormatter.ofPattern("d MMM")) : "TBD";

        return ProjectTasksDto.TaskItemDto.builder()
                .id(t.getTaskCode() != null ? t.getTaskCode() : "T-" + t.getId().toString().substring(0, 4))
                .title(t.getTitle())
                .milestone(milestoneName)
                .subtasksCount(t.getSubtasksCount())
                .linkedDocsCount(0)
                .assigneeInitials(initials)
                .assigneeName(assigneeName)
                .assigneeColor("#3B82F6")
                .priority(t.getPriority() != null ? t.getPriority().name() : "MEDIUM")
                .priorityStyle(t.getPriority() != null ? t.getPriority().name().toLowerCase() : "medium")
                .dueDate(dueStr)
                .dueDateColor(t.isBlocked() ? "#DC2626" : "#111111")
                .attachmentsCount(0)
                .isBlocked(t.isBlocked())
                .blockerReason(t.getBlockerReason())
                .build();
    }

    @Transactional
    public ProjectDocumentsDto getProjectDocuments(String projectId) {
        Project project = resolveProject(projectId);
        if (project == null) {
            return ProjectDocumentsDto.createDefault(projectId, "website redesign.", "Design Team", "15 Nov 2026", "ACTIVE");
        }

        List<ProjectDocument> docs = projectDocumentRepository.findByProjectIdWithAuthor(project.getId());
        List<ProjectDocumentsDto.DocumentItemDto> docDtos = docs.stream().map(d ->
                ProjectDocumentsDto.DocumentItemDto.builder()
                        .id(d.getId().toString())
                        .title(d.getTitle())
                        .category(d.getCategory())
                        .categoryKey(d.getCategoryKey())
                        .updatedAt("Updated recently")
                        .docNumber(d.getDocNumber())
                        .isSelected(d.isPinned())
                        .build()
        ).toList();

        ProjectDocumentsDto.LibraryDto library = ProjectDocumentsDto.LibraryDto.builder()
                .title("PROJECT LIBRARY")
                .categories(List.of("All", "Notes", "Plans", "Design", "Other"))
                .activeCategory("All")
                .documents(docDtos)
                .build();

        ProjectDocument activeDoc = docs.stream().filter(ProjectDocument::isPinned).findFirst().orElse(docs.isEmpty() ? null : docs.get(0));
        ProjectDocumentsDto.DocumentViewerDto viewer = null;
        if (activeDoc != null) {
            viewer = ProjectDocumentsDto.DocumentViewerDto.builder()
                    .docNumber(activeDoc.getDocNumber())
                    .title(activeDoc.getTitle())
                    .category(activeDoc.getCategory())
                    .date(LocalDate.now().format(DateTimeFormatter.ofPattern("d MMM yyyy")))
                    .team(project.getName())
                    .savedStatus("Saved 2 minutes ago")
                    .discussionParagraph1(activeDoc.getContent() != null ? activeDoc.getContent() : "We reviewed the latest designs and project direction.")
                    .discussionHighlighted("We also agreed to simplify the navigation and reduce unnecessary interface controls.")
                    .discussionParagraph2Remainder(" The revised approach will improve usability and content strategy.")
                    .collaborators(List.of(
                            ProjectDocumentsDto.CollaboratorDto.builder().initials("MJ").name("Maria J.").colorClass("avatar-mj").build(),
                            ProjectDocumentsDto.CollaboratorDto.builder().initials("PK").name("Peter K.").colorClass("avatar-pk").build()
                    ))
                    .attendees(List.of(
                            ProjectDocumentsDto.AttendeeDto.builder().initials("MJ").name("Maria J.").colorClass("avatar-mj").build(),
                            ProjectDocumentsDto.AttendeeDto.builder().initials("PK").name("Peter K.").colorClass("avatar-pk").build()
                    ))
                    .build();
        }

        String dueStr = project.getDueDate() != null ? project.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "15 Nov 2026";
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : "Design Team";

        return ProjectDocumentsDto.builder()
                .id(project.getId().toString())
                .breadcrumb("PROJECTS / 02 / " + project.getName().toUpperCase())
                .title(project.getName())
                .owner(ownerStr)
                .dueDate(dueStr)
                .status(project.getStatus() != null ? project.getStatus().name() : "Active")
                .library(library)
                .activeDocument(viewer)
                .build();
    }

    @Transactional
    public ProjectActivityDto getProjectActivity(String projectId) {
        Project project = resolveProject(projectId);
        if (project == null) {
            Organization organization = resolveCurrentOrganization();
            List<Project> projs = projectRepository.findByOrganizationIdWithDetails(organization.getId());
            project = projs.isEmpty() ? null : projs.get(0);
        }
        if (project == null) {
            throw new ResourceNotFoundException("Project not found: " + projectId);
        }

        Organization org = project.getOrganization();

        final String projectName = project.getName() != null ? project.getName() : "Team";

        List<ActivityEvent> events = activityEventRepository
                .findByOrganizationIdAndProjectIdOrderByEventTimestampDesc(org.getId(), project.getId());

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);
        LocalDate yesterday = today.minusDays(1);

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(zone);
        DateTimeFormatter fullDateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(zone);
        DateTimeFormatter dayNumFmt = DateTimeFormatter.ofPattern("dd").withZone(zone);
        DateTimeFormatter monthYearFmt = DateTimeFormatter.ofPattern("MMM yyyy").withZone(zone);
        DateTimeFormatter weekdayFmt = DateTimeFormatter.ofPattern("EEE").withZone(zone);

        Map<String, List<ActivityEvent>> groupedByDate = new LinkedHashMap<>();
        int countMilestones = 0;
        int countDecisions = 0;
        int countTasks = 0;
        int countDocs = 0;
        int countComments = 0;
        int countFiles = 0;
        int countMentions = 0;
        int importantCount = 0;

        for (ActivityEvent e : events) {
            Instant ts = e.getEventTimestamp() != null ? e.getEventTimestamp() : Instant.now();
            String dateKey = fullDateFmt.format(ts);
            groupedByDate.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(e);

            String catKey = e.getCategoryKey() != null ? e.getCategoryKey().toLowerCase() : "";
            switch (catKey) {
                case "milestones" -> countMilestones++;
                case "decisions" -> countDecisions++;
                case "tasks" -> countTasks++;
                case "documents" -> countDocs++;
                case "comments" -> countComments++;
                case "files" -> countFiles++;
                default -> {}
            }
            if (e.isMention()) {
                countMentions++;
            }
            if (e.isImportant()) {
                importantCount++;
            }
        }

        List<ProjectActivityDto.ActivityDateGroupDto> dateGroups = new ArrayList<>();
        for (Map.Entry<String, List<ActivityEvent>> entry : groupedByDate.entrySet()) {
            String fullDate = entry.getKey();
            List<ActivityEvent> dayEvents = entry.getValue();
            Instant firstTs = dayEvents.get(0).getEventTimestamp() != null ? dayEvents.get(0).getEventTimestamp() : Instant.now();
            LocalDate eventLocalDate = LocalDate.ofInstant(firstTs, zone);

            String weekday;
            if (eventLocalDate.equals(today)) {
                weekday = "TODAY";
            } else if (eventLocalDate.equals(yesterday)) {
                weekday = "YESTERDAY";
            } else {
                weekday = weekdayFmt.format(firstTs).toUpperCase();
            }

            List<ProjectActivityDto.ActivityEventDto> eventDtos = dayEvents.stream().map(e -> {
                Instant et = e.getEventTimestamp() != null ? e.getEventTimestamp() : Instant.now();

                String initials = "TD";
                String actorName = "Team Member";
                String actorTeam = projectName;
                String avatarColor = "#3B82F6";

                if (e.getActor() != null) {
                    actorName = e.getActor().getFullName();
                    if (actorName != null && !actorName.isBlank()) {
                        String[] parts = actorName.trim().split("\\s+");
                        if (parts.length >= 2) {
                            initials = ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                        } else if (parts.length == 1 && !parts[0].isEmpty()) {
                            initials = parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
                        }
                    }
                }

                return ProjectActivityDto.ActivityEventDto.builder()
                        .id(e.getId().toString())
                        .time(timeFmt.format(et))
                        .category(e.getBadgeType() != null ? e.getBadgeType() : "ACTIVITY")
                        .categoryKey(e.getCategoryKey() != null ? e.getCategoryKey() : "tasks")
                        .dotColor(e.getDotColor() != null ? e.getDotColor() : "blue")
                        .iconType(e.getIconType() != null ? e.getIconType() : "check-circle")
                        .iconBgClass(e.getIconBgClass() != null ? e.getIconBgClass() : "icon-bg-blue")
                        .title(e.getTitle())
                        .description(e.getDescription())
                        .statusFrom(e.getStatusFrom())
                        .statusTo(e.getStatusTo())
                        .userInitials(initials)
                        .userName(actorName)
                        .userTeam(actorTeam)
                        .avatarColor(avatarColor)
                        .actionLabel(e.getActionLabel())
                        .actionType(e.getActionType())
                        .actionTargetId(e.getActionTargetId())
                        .isImportant(e.isImportant())
                        .isMention(e.isMention())
                        .build();
            }).toList();

            dateGroups.add(ProjectActivityDto.ActivityDateGroupDto.builder()
                    .dayNumber(dayNumFmt.format(firstTs))
                    .monthYear(monthYearFmt.format(firstTs).toUpperCase())
                    .weekday(weekday)
                    .fullDate(fullDate)
                    .events(eventDtos)
                    .build());
        }

        ProjectActivityDto.SinceLastVisitDto sinceLastVisit = ProjectActivityDto.SinceLastVisitDto.builder()
                .count(importantCount)
                .title(importantCount + " important updates since your last visit")
                .description("Includes milestone completions, mentions, and key decisions.")
                .actionLabel("Dismiss")
                .build();

        ProjectActivityDto.ActivityFilterCountsDto filterCounts = ProjectActivityDto.ActivityFilterCountsDto.builder()
                .milestones(countMilestones)
                .decisions(countDecisions)
                .taskUpdates(countTasks)
                .documentActivity(countDocs)
                .comments(countComments)
                .filesAndAttachments(countFiles)
                .mentions(countMentions)
                .build();

        String dueStr = project.getDueDate() != null ? project.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "15 Nov 2026";
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : "Design Team";

        return ProjectActivityDto.builder()
                .id(project.getId().toString())
                .breadcrumb("PROJECTS / 02 / " + project.getName().toUpperCase())
                .title(project.getName())
                .owner(ownerStr)
                .dueDate(dueStr)
                .status(project.getStatus() != null ? project.getStatus().name() : "Active")
                .sinceLastVisit(sinceLastVisit)
                .filterCounts(filterCounts)
                .dateGroups(dateGroups)
                .build();
    }
}
