package com.shed.teamden.project.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.employee.entity.Department;
import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.repository.DepartmentRepository;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.team.entity.Team;
import com.shed.teamden.team.entity.TeamMember;
import com.shed.teamden.team.repository.TeamMemberRepository;
import com.shed.teamden.team.repository.TeamRepository;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.dto.*;
import com.shed.teamden.project.entity.*;
import com.shed.teamden.project.repository.*;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
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

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_PLANNING = "PLANNING";
    private static final String STATUS_ON_HOLD = "ON_HOLD";
    private static final String STATUS_BLOCKED = "BLOCKED";
    private static final String STATUS_LABEL_ACTIVE = "Active";

    private static final String HEALTH_AT_RISK = "AT_RISK";
    private static final String HEALTH_ON_TRACK = "ON_TRACK";

    private static final String PRIORITY_MEDIUM = "MEDIUM";
    private static final String PRIORITY_LABEL_MEDIUM = "Medium";
    private static final String PROJECT_TYPE_GENERAL = "General";

    private static final String DEFAULT_PROJECT_NAME = "Website Redesign";
    private static final String DEFAULT_WORKSPACE_NAME = "Workspace";
    private static final String DEFAULT_TEAM_NAME = "Design Team";
    private static final String DEFAULT_DUE_DATE = "15 Nov 2026";
    private static final String BREADCRUMB_PROJECTS_PREFIX = "PROJECTS / 02 / ";
    private static final String REGEX_LINE_BREAK = "\\r?\\n";

    private static final String COLOR_GREEN = "green";
    private static final String COLOR_AMBER = "amber";

    private static final String DATE_PATTERN_D_MMM_YYYY = "d MMM yyyy";
    private static final DateTimeFormatter DATE_FMT_D_MMM_YYYY = DateTimeFormatter.ofPattern(DATE_PATTERN_D_MMM_YYYY);
    private static final DateTimeFormatter DATE_FMT_DD_MMM = DateTimeFormatter.ofPattern("dd MMM");
    private static final DateTimeFormatter DATE_FMT_D_MMM = DateTimeFormatter.ofPattern("d MMM");

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
    private final OrganizationMembershipRepository organizationMembershipRepository;
    private final UserPinnedProjectRepository userPinnedProjectRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public ProjectService(ProjectRepository projectRepository,
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            ProjectMilestoneRepository projectMilestoneRepository,
            ProjectSpecificationRepository projectSpecificationRepository,
            ProjectDecisionRepository projectDecisionRepository,
            ProjectDocumentRepository projectDocumentRepository,
            ProjectMemberRepository projectMemberRepository,
            TaskRepository taskRepository,
            ActivityEventRepository activityEventRepository,
            OrganizationMembershipRepository organizationMembershipRepository,
            UserPinnedProjectRepository userPinnedProjectRepository,
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository,
            TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository) {
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
        this.organizationMembershipRepository = organizationMembershipRepository;
        this.userPinnedProjectRepository = userPinnedProjectRepository;
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
        this.teamRepository = teamRepository;
        this.teamMemberRepository = teamMemberRepository;
    }

    @Transactional
    public ProjectDashboardDto getProjectDashboardData() {
        try {
            Organization organization = resolveCurrentOrganization();
            resolveCurrentUser();

            List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(organization.getId());
            LocalDate today = LocalDate.now(ZoneId.systemDefault());

            long totalCount = allProjects.size();
            long activeCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
            long atRiskCount = allProjects.stream().filter(p -> HEALTH_AT_RISK.equalsIgnoreCase(p.getHealth())).count();
            long dueSoonCount = countDueSoonProjects(allProjects, today);

            List<ProjectItemDto> projectDtos = new ArrayList<>();
            List<DecisionItemDto> decisions = new ArrayList<>();
            List<ProjectAttentionDto> attention = new ArrayList<>();
            List<UpcomingMilestoneDto> milestones = new ArrayList<>();

            int pIdx = 1;
            for (Project p : allProjects) {
                projectDtos.add(buildProjectItemDto(p, pIdx++));
                collectPendingDecisions(p, decisions);
                collectBlockerAttention(p, attention);
                collectUpcomingMilestones(p, milestones);
            }

            ProjectItemDto featured = projectDtos.isEmpty() ? null : projectDtos.get(0);

            return ProjectDashboardDto.builder()
                    .workspaceBreadcrumb("YOUR WORKSPACE / 02")
                    .currentDateLabel(computeFormattedDate(today))
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

        } catch (Exception t) {
            log.error("Error generating projects dashboard data: {}", t.getMessage(), t);
            throw new RuntimeException("Failed to load project dashboard data: " + t.getMessage(), t);
        }
    }

    private String computeFormattedDate(LocalDate today) {
        String dayOfWeek = today.getDayOfWeek().name().substring(0, 3);
        String month = today.getMonth().name().substring(0, 3);
        String year = String.valueOf(today.getYear());
        String dayNum = String.format("%02d", today.getDayOfMonth());
        return dayOfWeek + ", " + dayNum + " " + month + " " + year;
    }

    private long countDueSoonProjects(List<Project> allProjects, LocalDate today) {
        LocalDate nextWeek = today.plusDays(7);
        return allProjects.stream()
                .filter(p -> p.getDueDate() != null
                        && !p.getDueDate().isBefore(today)
                        && p.getDueDate().isBefore(nextWeek)
                        && p.getStatus() != ProjectStatus.COMPLETED)
                .count();
    }

    private ProjectItemDto buildProjectItemDto(Project p, int index) {
        String stat = p.getStatus() != null ? p.getStatus().name() : STATUS_ACTIVE;
        String statLbl = stat.replace("_", " ");
        String dueLbl = p.getDueDate() != null
                ? "Due " + p.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                : "Upcoming";
        String health = p.getHealth() != null ? p.getHealth() : HEALTH_ON_TRACK;
        String healthLbl = health.replace("_", " ");
        String healthDot = HEALTH_AT_RISK.equalsIgnoreCase(health) ? "red" : COLOR_GREEN;

        List<ProjectMilestone> pMilestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(p.getId());
        long completedM = pMilestones.stream().filter(m -> m.getStatus() == MilestoneStatus.COMPLETED).count();
        String mLabel = pMilestones.isEmpty() ? "0 milestones" : String.format("%02d/%02d", completedM, pMilestones.size());

        List<Task> pTasks = taskRepository.findByProjectIdWithDetails(p.getId());
        long blockers = pTasks.stream().filter(t -> t != null && t.isBlocked()).count();

        String ownerName = p.getOwner() != null ? p.getOwner().getFullName() : "Team";
        String initials = computeInitials(ownerName, "TM");

        return ProjectItemDto.builder()
                .id(p.getId().toString())
                .indexNum(String.format("%02d", index))
                .name(p.getName())
                .description(p.getDescription() != null ? p.getDescription() : "Project workspace")
                .status(stat)
                .statusLabel(statLbl)
                .statusDotColor(resolveProjectStatusDotColor(stat))
                .health(health)
                .healthLabel(healthLbl)
                .healthDotColor(healthDot)
                .team(ownerName)
                .dueDate(dueLbl)
                .priority(p.getPriority() != null ? p.getPriority() : PRIORITY_LABEL_MEDIUM)
                .milestonesLabel(mLabel)
                .milestonesCompleted((int) completedM)
                .milestonesTotal(pMilestones.size())
                .blockersCount((int) blockers)
                .avatars(List.of(initials))
                .avatarOverflow("")
                .build();
    }

    private void collectPendingDecisions(Project p, List<DecisionItemDto> decisions) {
        if (decisions.size() >= 5) {
            return;
        }
        List<ProjectDecision> pDecisions = projectDecisionRepository.findByProjectIdWithDecider(p.getId());
        for (ProjectDecision d : pDecisions) {
            if (d.getStatus() == DecisionStatus.PENDING) {
                String subTitle = d.getSubTitle() != null ? d.getSubTitle() : "Review required";
                String dueStr = d.getDueDate() != null
                        ? "Due " + d.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                        : "Pending";
                decisions.add(DecisionItemDto.builder()
                        .id(d.getId().toString())
                        .projectTag(p.getName().toUpperCase(Locale.ROOT))
                        .title(d.getTitle())
                        .subTitle(subTitle)
                        .dueDate(dueStr)
                        .indicatorColor(COLOR_AMBER)
                        .hasAction(true)
                        .actionLabel("Review →")
                        .build());
                if (decisions.size() >= 5) {
                    break;
                }
            }
        }
    }

    private void collectBlockerAttention(Project p, List<ProjectAttentionDto> attention) {
        if (attention.size() >= 5) {
            return;
        }
        List<Task> pTasks = taskRepository.findByProjectIdWithDetails(p.getId());
        long blockers = pTasks.stream().filter(t -> t != null && t.isBlocked()).count();
        if (blockers > 0) {
            String metaLabel = blockers + (blockers == 1 ? " blocker" : " blockers");
            String dateLabel = p.getDueDate() != null
                    ? "Due " + p.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                    : STATUS_LABEL_ACTIVE;
            attention.add(ProjectAttentionDto.builder()
                    .id("att-" + p.getId().toString().substring(0, 4))
                    .indexNum(String.format("%02d", attention.size() + 1))
                    .statusType(STATUS_BLOCKED)
                    .statusDot("red")
                    .metaLabel(metaLabel)
                    .projectName(p.getName())
                    .detail(blockers + " blockers require input")
                    .dateLabel(dateLabel)
                    .build());
        }
    }

    private void collectUpcomingMilestones(Project p, List<UpcomingMilestoneDto> milestones) {
        if (milestones.size() >= 5) {
            return;
        }
        List<ProjectMilestone> pMilestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(p.getId());
        for (ProjectMilestone m : pMilestones) {
            if (m.getStatus() != MilestoneStatus.COMPLETED) {
                String mDate = m.getDueDate() != null
                        ? m.getDueDate().format(DATE_FMT_DD_MMM).toUpperCase(Locale.ROOT)
                        : "TBD";
                String dotColor = m.getStatus() == MilestoneStatus.CURRENT ? COLOR_GREEN : COLOR_AMBER;
                milestones.add(UpcomingMilestoneDto.builder()
                        .id(m.getId().toString())
                        .dateDayMonth(mDate)
                        .dotColor(dotColor)
                        .title(p.getName())
                        .subTitle(m.getName())
                        .build());
                if (milestones.size() >= 5) {
                    break;
                }
            }
        }
    }

    private String computeInitials(String fullName, String fallback) {
        if (fullName == null || fullName.isBlank()) {
            return fallback;
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length > 1) {
            return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(Locale.ROOT);
        }
        return fullName.substring(0, Math.min(2, fullName.length())).toUpperCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public ProjectOptionsDto getProjectOptions() {
        Organization organization = resolveCurrentOrganization();

        List<OrganizationMembership> memberships = organizationMembershipRepository
                .findByOrganizationIdAndStatusWithUser(organization.getId(), MembershipStatus.ACTIVE);

        List<ProjectOptionsDto.OwnerOptionDto> ownerDtos = memberships.stream()
                .map(m -> {
                    User u = m.getUser();
                    String fullName = (u != null && u.getFullName() != null) ? u.getFullName() : "Member";
                    String initials = computeInitials(fullName, "TM");
                    return ProjectOptionsDto.OwnerOptionDto.builder()
                            .id(u != null ? u.getId() : m.getId())
                            .name(fullName)
                            .email(u != null ? u.getEmail() : "")
                            .role(m.getRole() != null ? m.getRole().name() : "MEMBER")
                            .initials(initials)
                            .build();
                })
                .toList();

        List<Department> departments = departmentRepository.findByOrganizationIdOrderBySortOrderAsc(organization.getId());
        List<Employee> employees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(organization.getId());
        List<Team> teams = teamRepository.findByOrganizationIdWithDetails(organization.getId());
        List<ProjectOptionsDto.TeamOptionDto> teamDtos = buildTeamOptions(departments, employees, teams, ownerDtos);

        List<String> clients = projectRepository.findByOrganizationIdWithDetails(organization.getId()).stream()
                .map(Project::getClientName)
                .filter(c -> c != null && !c.isBlank())
                .distinct()
                .toList();
        if (clients.isEmpty()) {
            clients = List.of("Internal Project", "Acme Corporation", "Global Design Studio");
        }

        return ProjectOptionsDto.builder()
                .owners(ownerDtos)
                .teams(teamDtos)
                .clients(clients)
                .statuses(List.of("Planned", STATUS_ACTIVE, STATUS_PLANNING, STATUS_ON_HOLD, "COMPLETED", "CANCELLED"))
                .priorities(List.of("HIGH", PRIORITY_MEDIUM, "LOW", "URGENT", "High", PRIORITY_LABEL_MEDIUM, "Low", "Urgent"))
                .healthOptions(List.of(HEALTH_ON_TRACK, HEALTH_AT_RISK, "DELAYED"))
                .projectTypes(List.of("Design", "Development", "Engineering", "Marketing", "Internal", "Client Project", "Operations", "Research", "Other"))
                .build();
    }

    private List<ProjectOptionsDto.TeamOptionDto> buildTeamOptions(
            List<Department> departments, List<Employee> employees, List<Team> teams, List<ProjectOptionsDto.OwnerOptionDto> fallbackOwners) {
        List<ProjectOptionsDto.TeamOptionDto> teamDtos = new ArrayList<>();
        addTeamOptionsFromTeams(teams, teamDtos);
        addTeamOptionsFromDepartments(departments, employees, teamDtos);
        if (teamDtos.isEmpty()) {
            return buildFallbackTeamOptions(fallbackOwners);
        }
        return teamDtos;
    }

    private void addTeamOptionsFromTeams(List<Team> teams, List<ProjectOptionsDto.TeamOptionDto> teamDtos) {
        if (teams == null) {
            return;
        }
        for (Team t : teams) {
            List<TeamMember> tMembers = teamMemberRepository.findByTeamIdWithEmployee(t.getId());
            List<ProjectOptionsDto.TeamMemberOptionDto> memberDtos = tMembers.stream()
                    .map(this::mapTeamMemberToDto)
                    .toList();

            UUID headUserId = resolveTeamLeadUserId(t.getTeamLead());
            String headName = t.getTeamLead() != null ? t.getTeamLead().getFullName() : null;

            teamDtos.add(ProjectOptionsDto.TeamOptionDto.builder()
                    .id(t.getId())
                    .name(t.getName())
                    .subtitle(t.getDescription())
                    .headUserId(headUserId)
                    .headName(headName)
                    .members(memberDtos)
                    .build());
        }
    }

    private ProjectOptionsDto.TeamMemberOptionDto mapTeamMemberToDto(TeamMember tm) {
        Employee e = tm.getEmployee();
        String role = tm.getMemberRole() != null ? tm.getMemberRole() : e.getJobTitle();
        UUID userId = (e.getUser() != null) ? e.getUser().getId() : null;
        return ProjectOptionsDto.TeamMemberOptionDto.builder()
                .id(e.getId())
                .userId(userId)
                .name(e.getFullName())
                .email(e.getEmail())
                .role(role)
                .initials(e.getInitials())
                .build();
    }

    private UUID resolveTeamLeadUserId(Employee lead) {
        if (lead == null) {
            return null;
        }
        if (lead.getUser() != null) {
            return lead.getUser().getId();
        }
        return lead.getId();
    }

    private void addTeamOptionsFromDepartments(
            List<Department> departments, List<Employee> employees, List<ProjectOptionsDto.TeamOptionDto> teamDtos) {
        if (departments == null) {
            return;
        }
        for (Department d : departments) {
            boolean alreadyAdded = teamDtos.stream().anyMatch(td -> td.getName().equalsIgnoreCase(d.getName()));
            if (!alreadyAdded) {
                List<ProjectOptionsDto.TeamMemberOptionDto> members = employees.stream()
                        .filter(e -> e.getDepartment() != null && e.getDepartment().getId().equals(d.getId()))
                        .map(this::mapEmployeeToTeamMemberOptionDto)
                        .toList();

                UUID headUserId = d.getDepartmentHead() != null ? d.getDepartmentHead().getId() : null;
                String headName = d.getDepartmentHead() != null ? d.getDepartmentHead().getFullName() : null;

                teamDtos.add(ProjectOptionsDto.TeamOptionDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .subtitle(d.getSubtitle())
                        .headUserId(headUserId)
                        .headName(headName)
                        .members(members)
                        .build());
            }
        }
    }

    private ProjectOptionsDto.TeamMemberOptionDto mapEmployeeToTeamMemberOptionDto(Employee e) {
        UUID userId = (e.getUser() != null) ? e.getUser().getId() : null;
        return ProjectOptionsDto.TeamMemberOptionDto.builder()
                .id(e.getId())
                .userId(userId)
                .name(e.getFullName())
                .email(e.getEmail())
                .role(e.getJobTitle())
                .initials(e.getInitials())
                .build();
    }

    private List<ProjectOptionsDto.TeamOptionDto> buildFallbackTeamOptions(List<ProjectOptionsDto.OwnerOptionDto> fallbackOwners) {
        List<ProjectOptionsDto.TeamMemberOptionDto> defaultMembers = fallbackOwners.stream()
                .map(o -> ProjectOptionsDto.TeamMemberOptionDto.builder()
                        .id(o.getId())
                        .userId(o.getId())
                        .name(o.getName())
                        .email(o.getEmail())
                        .role(o.getRole())
                        .initials(o.getInitials())
                        .build())
                .toList();
        return List.of(
                ProjectOptionsDto.TeamOptionDto.builder().id(UUID.randomUUID()).name(DEFAULT_TEAM_NAME).subtitle("Product Design & UX").members(defaultMembers).build(),
                ProjectOptionsDto.TeamOptionDto.builder().id(UUID.randomUUID()).name("Engineering").subtitle("Core Platform & Frontend").members(defaultMembers).build(),
                ProjectOptionsDto.TeamOptionDto.builder().id(UUID.randomUUID()).name("Marketing").subtitle("Growth & Brand").members(defaultMembers).build(),
                ProjectOptionsDto.TeamOptionDto.builder().id(UUID.randomUUID()).name("Product Operations").subtitle("Operations & Delivery").members(defaultMembers).build()
        );
    }

    @Transactional
    public ProjectItemDto createProject(CreateProjectRequestDto req) {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new BadRequestException("Project name is required");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();
        User projectOwner = resolveProjectOwner(req.getOwnerId(), organization.getId());

        ProjectStatus status = parseProjectStatus(req.getStatus());
        String health = resolveProjectHealth(req.getHealth());
        String priority = resolveProjectPriority(req.getPriority());
        String projectType = resolveProjectType(req.getCategory() != null ? req.getCategory() : req.getProjectType());

        LocalDate start = parseProjectDate(req.getStartDate(), LocalDate.now(ZoneId.systemDefault()));
        LocalDate due = parseProjectDate(req.getDueDate(), start.plusDays(30));

        // Generate unique Project Code
        String projectCode = req.getProjectCode();
        if (projectCode == null || projectCode.isBlank()) {
            long totalCount = projectRepository.countByOrganizationId(organization.getId());
            projectCode = String.format("PRJ-%03d", totalCount + 1);
        }

        // Resolve Team and Team Lead
        Department teamDept = (req.getTeamId() != null)
                ? departmentRepository.findByIdAndOrganizationId(req.getTeamId(), organization.getId()).orElse(null)
                : null;
        String teamName = resolveTeamName(teamDept, req.getTeamName());
        User teamLead = (req.getTeamLeadId() != null)
                ? userRepository.findById(req.getTeamLeadId()).orElse(null)
                : null;
        User effectiveOwner = resolveEffectiveOwner(teamLead, projectOwner);

        String goals = (req.getGoals() != null && !req.getGoals().isBlank()) ? req.getGoals().trim() : req.getDescription();
        String deliverables = req.getDeliverables() != null ? req.getDeliverables().trim() : "";

        Project newProject = Project.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .projectCode(projectCode)
                .name(req.getName().trim())
                .description(req.getDescription() != null ? req.getDescription().trim() : "")
                .goals(goals)
                .deliverables(deliverables)
                .teamId(req.getTeamId())
                .teamName(teamName)
                .teamLead(teamLead)
                .owner(effectiveOwner)
                .createdBy(currentUser)
                .clientName(req.getClientName() != null ? req.getClientName().trim() : null)
                .coverImageUrl(req.getCoverImageUrl() != null ? req.getCoverImageUrl().trim() : null)
                .progress(0)
                .status(status)
                .health(health)
                .priority(priority)
                .projectType(projectType)
                .startDate(start)
                .dueDate(due)
                .build();

        newProject = projectRepository.save(newProject);
        assignProjectMembers(newProject, req.getMemberIds());
        recordProjectCreatedActivity(organization, currentUser, newProject);

        long totalCount = projectRepository.countByOrganizationId(organization.getId());
        String indexNum = String.format("%02d", totalCount);

        return toProjectItemDto(newProject, indexNum);
    }

    private void assignProjectMembers(Project project, List<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return;
        }
        for (UUID userId : memberIds) {
            Optional<User> uOpt = userRepository.findById(userId);
            if (uOpt.isPresent()) {
                ProjectMember member = ProjectMember.builder()
                        .id(UUID.randomUUID())
                        .organization(project.getOrganization())
                        .project(project)
                        .user(uOpt.get())
                        .role("MEMBER")
                        .build();
                projectMemberRepository.save(member);
            }
        }
    }

    private User resolveProjectOwner(UUID ownerId, UUID organizationId) {
        if (ownerId == null) {
            return null;
        }
        Optional<User> ownerOpt = userRepository.findById(ownerId);
        if (ownerOpt.isPresent()) {
            Optional<OrganizationMembership> memberOpt = organizationMembershipRepository
                    .findByOrganizationIdAndUserId(organizationId, ownerId);
            if (memberOpt.isPresent()) {
                return ownerOpt.get();
            }
        }
        return null;
    }

    private String resolveTeamName(Department teamDept, String reqTeamName) {
        if (teamDept != null) {
            return teamDept.getName();
        }
        if (reqTeamName != null && !reqTeamName.isBlank()) {
            return reqTeamName.trim();
        }
        return DEFAULT_TEAM_NAME;
    }

    private User resolveEffectiveOwner(User teamLead, User projectOwner) {
        if (teamLead != null) {
            return teamLead;
        }
        return projectOwner;
    }

    private String resolveProjectSubMeta(String projectType) {
        if (projectType != null && !projectType.isBlank()) {
            return projectType + " / Workspace";
        }
        return "Workspace / Projects";
    }

    private ProjectStatus parseProjectStatus(String statusStr) {
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                return ProjectStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                log.debug("Invalid project status '{}', defaulting to ACTIVE", statusStr);
            }
        }
        return ProjectStatus.ACTIVE;
    }

    private LocalDate parseProjectDate(String dateStr, LocalDate defaultDate) {
        if (dateStr != null && !dateStr.isBlank()) {
            try {
                return LocalDate.parse(dateStr.trim());
            } catch (java.time.format.DateTimeParseException ignored) {
                log.debug("Unable to parse date '{}', defaulting to default date", dateStr);
            }
        }
        return defaultDate;
    }

    private String resolveProjectHealth(String health) {
        return (health != null && !health.isBlank()) ? health.trim().toUpperCase() : HEALTH_ON_TRACK;
    }

    private String resolveProjectPriority(String priority) {
        return (priority != null && !priority.isBlank()) ? priority.trim().toUpperCase() : PRIORITY_MEDIUM;
    }

    private String resolveProjectType(String projectType) {
        return (projectType != null && !projectType.isBlank()) ? projectType.trim() : PROJECT_TYPE_GENERAL;
    }

    private void recordProjectCreatedActivity(Organization organization, User currentUser, Project newProject) {
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(currentUser)
                .eventType(ActivityEventType.PROJECT_CREATED)
                .entityType("PROJECT")
                .entityId(newProject.getId())
                .title("created project")
                .description(newProject.getName())
                .actionText("created project")
                .targetTitle(newProject.getName())
                .subMeta(resolveProjectSubMeta(newProject.getProjectType()))
                .badgeType("DOCUMENT")
                .dotColor(COLOR_GREEN)
                .eventTimestamp(Instant.now())
                .build();
        activityEventRepository.save(event);
    }

    @Transactional
    public ProjectDocumentsDto.DocumentItemDto createDocument(CreateDocumentRequestDto req) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();

        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Document title is required");
        }

        Project project = null;
        if (req.getProjectId() != null) {
            project = projectRepository.findByIdAndOrganizationId(req.getProjectId(), organization.getId())
                    .orElse(null);
        }
        if (project == null) {
            List<Project> orgProjects = projectRepository.findByOrganizationId(organization.getId(),
                    org.springframework.data.domain.PageRequest.of(0, 1));
            if (!orgProjects.isEmpty()) {
                project = orgProjects.get(0);
            }
        }
        if (project == null) {
            project = projectRepository.save(Project.builder()
                    .id(UUID.randomUUID())
                    .organization(organization)
                    .name("General Workspace")
                    .status(ProjectStatus.ACTIVE)
                    .owner(currentUser)
                    .build());
        }

        long count = projectDocumentRepository.count();
        String docNumber = String.format("DOCUMENT / %03d", count + 1);

        ProjectDocument doc = ProjectDocument.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .project(project)
                .docNumber(docNumber)
                .title(req.getTitle().trim())
                .category(req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim()
                        : "Meeting Notes")
                .categoryKey(req.getCategory() != null ? req.getCategory().trim() : "Notes")
                .content(req.getContent() != null ? req.getContent().trim() : "")
                .fileType(req.getFileType() != null ? req.getFileType() : "DOC")
                .author(currentUser)
                .isPinned(false)
                .build();

        doc = projectDocumentRepository.save(doc);

        return ProjectDocumentsDto.DocumentItemDto.builder()
                .id(doc.getId().toString())
                .title(doc.getTitle())
                .category(doc.getCategory())
                .categoryKey(doc.getCategoryKey())
                .updatedAt("Just now")
                .docNumber(doc.getDocNumber())
                .isSelected(true)
                .build();
    }

    @Transactional(readOnly = true)
    public List<ProjectItemDto> getUnassignedProjects() {
        Organization organization = resolveCurrentOrganization();
        List<Project> unassigned = projectRepository.findUnassignedByOrganizationId(organization.getId());
        List<ProjectItemDto> dtos = new ArrayList<>();
        int idx = 1;
        for (Project p : unassigned) {
            dtos.add(toProjectItemDto(p, String.format("%02d", idx++)));
        }
        return dtos;
    }

    @Transactional
    public ProjectItemDto assignProjectLead(UUID projectId, UUID newOwnerId) {
        if (projectId == null) {
            throw new BadRequestException("Project ID is required");
        }
        if (newOwnerId == null) {
            throw new BadRequestException("Owner ID is required");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();

        Project project = projectRepository.findByOrganizationIdAndId(organization.getId(), projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found in this organization"));

        User newOwner = userRepository.findById(newOwnerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        organizationMembershipRepository.findByOrganizationIdAndUserId(organization.getId(), newOwnerId)
                .orElseThrow(
                        () -> new BadRequestException("Selected user is not an active member of this organization"));

        project.setOwner(newOwner);
        project = projectRepository.save(project);

        // Record Activity Event
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(currentUser)
                .eventType(ActivityEventType.PROJECT_UPDATED)
                .entityType("PROJECT")
                .entityId(project.getId())
                .title("assigned project lead")
                .description("Assigned " + newOwner.getFullName() + " to " + project.getName())
                .actionText("assigned project lead to " + newOwner.getFullName())
                .targetTitle(project.getName())
                .subMeta(resolveProjectSubMeta(project.getProjectType()))
                .badgeType("DOCUMENT")
                .dotColor("blue")
                .eventTimestamp(Instant.now())
                .build();
        activityEventRepository.save(event);

        return toProjectItemDto(project, "01");
    }

    private ProjectItemDto toProjectItemDto(Project p, String indexNum) {
        String stat = p.getStatus() != null ? p.getStatus().name() : STATUS_ACTIVE;
        String statLbl = stat.replace("_", " ");
        String dueLbl = p.getDueDate() != null
                ? "Due " + p.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                : "Upcoming";
        String health = p.getHealth() != null ? p.getHealth() : HEALTH_ON_TRACK;
        String healthLbl = health.replace("_", " ");
        String healthDot = HEALTH_AT_RISK.equalsIgnoreCase(health) ? "red" : COLOR_GREEN;

        String ownerName = (p.getOwner() != null && p.getOwner().getFullName() != null)
                ? p.getOwner().getFullName()
                : "Unassigned";

        List<String> avatars = resolveOwnerAvatars(p, ownerName);

        String priority = p.getPriority() != null ? p.getPriority() : PRIORITY_MEDIUM;
        String priorityLabel = priority.charAt(0) + priority.substring(1).toLowerCase() + " Priority";

        String statusDotColor = resolveProjectStatusDotColor(p.getStatus());

        List<ProjectMilestone> pMilestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(p.getId());
        long completedM = pMilestones.stream().filter(m -> m.getStatus() == MilestoneStatus.COMPLETED).count();
        String mLabel = computeMilestonesProgressLabel(pMilestones, completedM);

        return ProjectItemDto.builder()
                .id(p.getId().toString())
                .indexNum(indexNum)
                .name(p.getName())
                .description(p.getDescription() != null ? p.getDescription() : "")
                .status(stat)
                .statusLabel(statLbl)
                .statusDotColor(statusDotColor)
                .health(health)
                .healthLabel(healthLbl)
                .healthDotColor(healthDot)
                .team(ownerName)
                .dueDate(dueLbl)
                .priority(priorityLabel)
                .milestonesLabel(mLabel)
                .milestonesCompleted((int) completedM)
                .milestonesTotal(pMilestones.size())
                .blockersCount(0)
                .avatars(avatars)
                .avatarOverflow("")
                .build();
    }

    private List<String> resolveOwnerAvatars(Project p, String ownerName) {
        List<String> avatars = new ArrayList<>();
        if (p.getOwner() != null && p.getOwner().getFullName() != null) {
            avatars.add(computeInitials(ownerName, "TM"));
        } else {
            avatars.add("??");
        }
        return avatars;
    }

    private String computeMilestonesProgressLabel(List<ProjectMilestone> pMilestones, long completedM) {
        if (pMilestones.isEmpty()) {
            return "0/0 milestones";
        }
        return String.format("%02d/%02d", completedM, pMilestones.size());
    }

    private String resolveProjectStatusDotColor(ProjectStatus status) {
        if (status == null) {
            return COLOR_GREEN;
        }
        return switch (status) {
            case ACTIVE -> COLOR_GREEN;
            case PLANNING -> "blue";
            case ON_HOLD -> "red";
            default -> "orange";
        };
    }

    private String resolveProjectStatusDotColor(String status) {
        if (status == null || STATUS_ACTIVE.equalsIgnoreCase(status)) {
            return COLOR_GREEN;
        }
        if (STATUS_PLANNING.equalsIgnoreCase(status)) {
            return "blue";
        }
        if (STATUS_ON_HOLD.equalsIgnoreCase(status)) {
            return "red";
        }
        return "gray";
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
        throw new UnauthorizedException("Authentication required. No active workspace found.");
    }

    private User resolveCurrentUser() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            return userRepository.findById(userOpt.get().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userOpt.get().getId()));
        }
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }
        throw new UnauthorizedException("Authentication required. No active user found.");
    }

    private Project resolveProject(String projectId) {
        Organization org;
        try {
            org = resolveCurrentOrganization();
        } catch (UnauthorizedException e) {
            return null;
        }

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
                    .filter(p -> p.getName().equalsIgnoreCase(DEFAULT_PROJECT_NAME))
                    .findFirst()
                    .orElse(orgProjects.get(0));
        }
        return null;
    }

    @Transactional
    public ProjectOverviewDto getProjectOverview(String projectId) {
        Project project = resolveProject(projectId);
        if (project == null) {
            return ProjectOverviewDto.createDefault(projectId, DEFAULT_PROJECT_NAME,
                    "Redesign the website into a responsive, modern experience.", DEFAULT_WORKSPACE_NAME, DEFAULT_DUE_DATE,
                    STATUS_ACTIVE);
        }

        List<ProjectMilestone> milestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(project.getId());
        int milestonesTotal = milestones.size();
        int milestonesCompleted = (int) milestones.stream().filter(m -> m.getStatus() == MilestoneStatus.COMPLETED).count();
        String milestonesSummary = String.format("%02d/%02d COMPLETED", milestonesCompleted, milestonesTotal);
        List<ProjectOverviewDto.MilestoneStageDto> milestoneDtos = buildMilestoneStageDtos(milestones);

        ProjectOverviewDto.SpecificationDto specDto = resolveOrCreateSpecificationDto(project);

        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
        List<ProjectOverviewDto.WorkStatusCardDto> workCards = buildWorkStatusCards(tasks);
        long blockedCount = tasks.stream().filter(t -> t != null && t.isBlocked()).count();

        List<ProjectDocument> docs = projectDocumentRepository.findByProjectIdWithAuthor(project.getId());
        List<ProjectOverviewDto.ProjectDocumentDto> docDtos = buildProjectDocumentDtos(docs);

        List<ProjectDecision> decisions = projectDecisionRepository.findByProjectIdWithDecider(project.getId());
        ProjectOverviewDto.PendingDecisionDto pendingDecisionDto = buildPendingDecisionDto(decisions);

        List<ProjectMember> members = projectMemberRepository.findByProjectIdWithUser(project.getId());
        List<String> memberInitials = resolveMemberInitials(members);

        String dueStr = project.getDueDate() != null
                ? project.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                : DEFAULT_DUE_DATE;
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : DEFAULT_TEAM_NAME;

        return ProjectOverviewDto.builder()
                .id(project.getId().toString())
                .breadcrumb(BREADCRUMB_PROJECTS_PREFIX + project.getName().toUpperCase())
                .title(project.getName())
                .description(project.getDescription() != null ? project.getDescription() : "Project workspace")
                .owner(ownerStr)
                .dueDate(dueStr)
                .projectType(project.getProjectType() != null ? project.getProjectType() : "Design / Development")
                .health(HEALTH_AT_RISK.equalsIgnoreCase(project.getHealth()) ? "At Risk" : "On Track")
                .healthDotColor(HEALTH_AT_RISK.equalsIgnoreCase(project.getHealth()) ? "orange" : COLOR_GREEN)
                .status(project.getStatus() != null ? project.getStatus().name() : STATUS_LABEL_ACTIVE)
                .statusDotColor(COLOR_GREEN)
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

    private List<ProjectOverviewDto.MilestoneStageDto> buildMilestoneStageDtos(List<ProjectMilestone> milestones) {
        return milestones.stream()
                .map(m -> ProjectOverviewDto.MilestoneStageDto.builder()
                        .id(m.getId().toString())
                        .seqNum(String.format("%02d", m.getSeqNum()))
                        .name(m.getName())
                        .status(m.getStatus().name())
                        .statusLabel(m.getStatusLabel() != null ? m.getStatusLabel() : m.getStatus().name())
                        .build())
                .toList();
    }

    private ProjectOverviewDto.SpecificationDto resolveOrCreateSpecificationDto(Project project) {
        ProjectSpecification spec = projectSpecificationRepository.findByProjectId(project.getId())
                .orElseGet(() -> {
                    ProjectSpecification newSpec = ProjectSpecification.builder()
                            .id(UUID.randomUUID())
                            .organization(project.getOrganization())
                            .project(project)
                            .title("Build a better digital experience.")
                            .objectives("Improve user experience\nIncrease conversion rate")
                            .deliverables("Responsive website\nCMS implementation")
                            .successCriteria("Higher engagement\nIncreased conversion rate")
                            .clientName(project.getOrganization() != null ? project.getOrganization().getName() : DEFAULT_WORKSPACE_NAME)
                            .focusArea("Brand, performance and growth")
                            .build();
                    return projectSpecificationRepository.save(newSpec);
                });

        List<String> objectives = parseDelimitedLines(spec.getObjectives());
        List<String> deliverables = parseDelimitedLines(spec.getDeliverables());
        List<String> successCriteria = parseDelimitedLines(spec.getSuccessCriteria());

        String clientName = resolveClientName(spec.getClientName(), project.getOrganization());

        return ProjectOverviewDto.SpecificationDto.builder()
                .title(spec.getTitle())
                .objectives(objectives)
                .deliverables(deliverables)
                .successCriteria(successCriteria)
                .projectContext(Map.of(
                        "Client", clientName,
                        "Type", project.getProjectType() != null ? project.getProjectType() : "Design / Development",
                        "Focus", spec.getFocusArea() != null ? spec.getFocusArea() : "Brand, performance and growth"))
                .build();
    }

    private String resolveClientName(String clientName, Organization organization) {
        if (clientName != null && !clientName.isBlank()) {
            return clientName;
        }
        if (organization != null && organization.getName() != null) {
            return organization.getName();
        }
        return DEFAULT_WORKSPACE_NAME;
    }

    private List<String> parseDelimitedLines(String text) {
        return (text != null) ? Arrays.asList(text.split(REGEX_LINE_BREAK)) : List.of();
    }

    private List<ProjectOverviewDto.WorkStatusCardDto> buildWorkStatusCards(List<Task> tasks) {
        long todoCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.TODO).count();
        long inProgCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long inRevCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_REVIEW).count();
        long blockedCount = tasks.stream().filter(t -> t != null && t.isBlocked()).count();

        return List.of(
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("TODO")
                        .statusLabel("TO DO")
                        .dotColor("gray")
                        .count(String.format("%02d", todoCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.TODO)
                                .findFirst().map(Task::getTitle).orElse("Prepare responsive layouts"))
                        .assigneeAvatar("AR")
                        .build(),
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("IN_PROGRESS")
                        .statusLabel("IN PROGRESS")
                        .dotColor(COLOR_AMBER)
                        .count(String.format("%02d", inProgCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_PROGRESS)
                                .findFirst().map(Task::getTitle).orElse("Homepage development"))
                        .assigneeAvatar("MJ")
                        .build(),
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey("IN_REVIEW")
                        .statusLabel("IN REVIEW")
                        .dotColor("blue")
                        .count(String.format("%02d", inRevCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.IN_REVIEW)
                                .findFirst().map(Task::getTitle).orElse("Design system review"))
                        .assigneeAvatar("SK")
                        .build(),
                ProjectOverviewDto.WorkStatusCardDto.builder()
                        .statusKey(STATUS_BLOCKED)
                        .statusLabel(STATUS_BLOCKED)
                        .dotColor("red")
                        .count(String.format("%02d", blockedCount))
                        .exampleTask(tasks.stream().filter(t -> t != null && t.isBlocked()).findFirst()
                                .map(Task::getTitle).orElse("Client copy approval"))
                        .assigneeAvatar("PK")
                        .build());
    }

    private List<ProjectOverviewDto.ProjectDocumentDto> buildProjectDocumentDtos(List<ProjectDocument> docs) {
        return docs.stream()
                .map(d -> ProjectOverviewDto.ProjectDocumentDto.builder()
                        .name(d.getTitle())
                        .fileType(d.getFileType())
                        .fileSize(d.getFileSize() != null ? d.getFileSize() : "1.2 MB")
                        .iconType(d.getFileType().toLowerCase())
                        .build())
                .toList();
    }

    private ProjectOverviewDto.PendingDecisionDto buildPendingDecisionDto(List<ProjectDecision> decisions) {
        Optional<ProjectDecision> firstPending = decisions.stream().filter(d -> d.getStatus() == DecisionStatus.PENDING)
                .findFirst();
        ProjectOverviewDto.PendingDecisionDto pendingDecisionDto = null;
        if (firstPending.isPresent()) {
            ProjectDecision dec = firstPending.get();
            String ownerName = dec.getDecider() != null ? dec.getDecider().getFullName() : "Lead Reviewer";
            String initials = computeInitials(ownerName, "LR");
            String dueLbl = dec.getDueDate() != null ? dec.getDueDate().format(DATE_FMT_D_MMM)
                    : "Soon";
            pendingDecisionDto = ProjectOverviewDto.PendingDecisionDto.builder()
                    .title(dec.getTitle())
                    .description(dec.getDescription() != null ? dec.getDescription() : "Decision awaiting review.")
                    .statusLabel("Awaiting Your Review")
                    .dueDateLabel(dueLbl)
                    .ownerName(ownerName)
                    .ownerInitials(initials)
                    .build();
        }
        return pendingDecisionDto;
    }

    private List<String> resolveMemberInitials(List<ProjectMember> members) {
        List<String> memberInitials = new ArrayList<>();
        for (ProjectMember m : members) {
            if (m.getUser() != null) {
                memberInitials.add(computeInitials(m.getUser().getFullName(), "MB"));
            }
        }
        if (memberInitials.isEmpty()) {
            memberInitials = List.of("PK", "AR", "SK", "MJ");
        }
        return memberInitials;
    }

    @Transactional
    public ProjectTasksDto getProjectTasks(String projectId) {
        Project project = resolveProject(projectId);
        if (project == null) {
            return ProjectTasksDto.createDefault(projectId, DEFAULT_PROJECT_NAME, DEFAULT_WORKSPACE_NAME, DEFAULT_DUE_DATE,
                    STATUS_ACTIVE);
        }

        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
        List<ProjectMilestone> milestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(project.getId());

        ProjectTasksDto.WorkStatusSummaryDto workStatus = buildWorkStatusSummary(tasks);
        List<ProjectTasksDto.TaskGroupDto> taskGroups = buildTaskGroups(tasks);

        List<ProjectTasksDto.BlockedTaskDto> blockedList = tasks.stream()
                .filter(t -> t != null && t.isBlocked())
                .map(t -> ProjectTasksDto.BlockedTaskDto.builder()
                        .id(t.getTaskCode() != null ? t.getTaskCode() : "T-" + t.getId().toString().substring(0, 4))
                        .title(t.getTitle())
                        .reason(t.getBlockerReason() != null ? t.getBlockerReason() : "Awaiting input")
                        .build())
                .toList();

        long inProgCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long blockedCount = tasks.stream().filter(t -> t != null && t.isBlocked()).count();
        ProjectTasksDto.CurrentMilestoneDto currDto = buildCurrentMilestoneDto(milestones, (int) inProgCount, (int) blockedCount);

        List<ProjectTasksDto.MilestoneSummaryDto> byMilestone = milestones.stream().map(m -> {
            long count = tasks.stream()
                    .filter(t -> t.getMilestone() != null && t.getMilestone().getId().equals(m.getId())).count();
            return ProjectTasksDto.MilestoneSummaryDto.builder()
                    .num(m.getCode())
                    .title(m.getName())
                    .count((int) count)
                    .isActive(m.getStatus() == MilestoneStatus.CURRENT)
                    .build();
        }).toList();

        String dueStr = project.getDueDate() != null
                ? project.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                : DEFAULT_DUE_DATE;
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : DEFAULT_TEAM_NAME;

        return ProjectTasksDto.builder()
                .id(project.getId().toString())
                .breadcrumb(BREADCRUMB_PROJECTS_PREFIX + project.getName().toUpperCase())
                .title(project.getName())
                .owner(ownerStr)
                .dueDate(dueStr)
                .status(project.getStatus() != null ? project.getStatus().name() : STATUS_LABEL_ACTIVE)
                .workStatus(workStatus)
                .taskGroups(taskGroups)
                .currentMilestone(currDto)
                .blockedTasks(blockedList)
                .tasksByMilestone(byMilestone)
                .linkedKnowledge(List.of(
                        ProjectTasksDto.KnowledgeDocDto.builder().title("Design Review Notes").linkedTasksCount(2)
                                .icon("file").build(),
                        ProjectTasksDto.KnowledgeDocDto.builder().title("Project Brief").linkedTasksCount(1)
                                .icon("file").build(),
                        ProjectTasksDto.KnowledgeDocDto.builder().title("Design Guidelines").linkedTasksCount(3)
                                .icon("link").build()))
                .quickActions(List.of(
                        ProjectTasksDto.QuickActionDto.builder().actionKey("add_task").title("Add new task")
                                .icon("plus").build(),
                        ProjectTasksDto.QuickActionDto.builder().actionKey("filter_mine").title("Filter my tasks")
                                .icon("filter").build()))
                .build();
    }

    private ProjectTasksDto.WorkStatusSummaryDto buildWorkStatusSummary(List<Task> tasks) {
        int totalTasks = tasks.size();
        long todoCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        long inProgCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        long inRevCount = tasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_REVIEW).count();
        long completedCount = tasks.stream().filter(t -> t != null && t.getStatus() == TaskStatus.COMPLETED).count();
        long blockedCount = tasks.stream().filter(t -> t != null && t.isBlocked()).count();

        return ProjectTasksDto.WorkStatusSummaryDto.builder()
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
    }

    private List<ProjectTasksDto.TaskGroupDto> buildTaskGroups(List<Task> tasks) {
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

        return List.of(
                ProjectTasksDto.TaskGroupDto.builder().key("in_progress").label("In Progress")
                        .count(inProgressItems.size()).dotColor(COLOR_AMBER).isExpanded(true).tasks(inProgressItems)
                        .build(),
                ProjectTasksDto.TaskGroupDto.builder().key("todo").label("To Do").count(todoItems.size())
                        .dotColor("gray").isExpanded(false).tasks(todoItems).build(),
                ProjectTasksDto.TaskGroupDto.builder().key("in_review").label("In Review").count(inReviewItems.size())
                        .dotColor("blue").isExpanded(false).tasks(inReviewItems).build(),
                ProjectTasksDto.TaskGroupDto.builder().key("completed").label("Completed").count(completedItems.size())
                        .dotColor(COLOR_GREEN).isCheckIcon(true).isExpanded(false).tasks(completedItems).build());
    }

    private ProjectTasksDto.CurrentMilestoneDto buildCurrentMilestoneDto(
            List<ProjectMilestone> milestones, int inProgCount, int blockedCount) {
        ProjectMilestone currMilestone = milestones.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.CURRENT)
                .findFirst()
                .orElse(null);
        if (currMilestone == null && !milestones.isEmpty()) {
            currMilestone = milestones.get(0);
        }

        if (currMilestone == null) {
            return null;
        }

        return ProjectTasksDto.CurrentMilestoneDto.builder()
                .number("Milestone " + currMilestone.getCode())
                .name(currMilestone.getName())
                .activeTasksCount(inProgCount)
                .blockedTasksCount(blockedCount)
                .progressPercent(65)
                .build();
    }

    private ProjectTasksDto.TaskItemDto mapToTaskItemDto(Task t) {
        String milestoneName = t.getMilestone() != null ? "Milestone " + t.getMilestone().getCode() : PROJECT_TYPE_GENERAL;
        String assigneeName = t.getAssignee() != null ? t.getAssignee().getFullName() : "Unassigned";
        String initials = computeInitials(assigneeName, "UA");
        String dueStr = t.getDueDate() != null ? t.getDueDate().format(DATE_FMT_D_MMM) : "TBD";

        return ProjectTasksDto.TaskItemDto.builder()
                .id(t.getTaskCode() != null ? t.getTaskCode() : "T-" + t.getId().toString().substring(0, 4))
                .title(t.getTitle())
                .milestone(milestoneName)
                .subtasksCount(t.getSubtasksCount())
                .linkedDocsCount(0)
                .assigneeInitials(initials)
                .assigneeName(assigneeName)
                .assigneeColor("#3B82F6")
                .priority(t.getPriority() != null ? t.getPriority().name() : PRIORITY_MEDIUM)
                .priorityStyle(t.getPriority() != null ? t.getPriority().name().toLowerCase() : PRIORITY_LABEL_MEDIUM.toLowerCase())
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
            return ProjectDocumentsDto.createDefault(projectId, DEFAULT_PROJECT_NAME, DEFAULT_WORKSPACE_NAME, DEFAULT_DUE_DATE,
                    STATUS_ACTIVE);
        }

        List<ProjectDocument> docs = projectDocumentRepository.findByProjectIdWithAuthor(project.getId());
        List<ProjectDocumentsDto.DocumentItemDto> docDtos = docs.stream()
                .map(d -> ProjectDocumentsDto.DocumentItemDto.builder()
                        .id(d.getId().toString())
                        .title(d.getTitle())
                        .category(d.getCategory())
                        .categoryKey(d.getCategoryKey())
                        .updatedAt("Updated recently")
                        .docNumber(d.getDocNumber())
                        .isSelected(d.isPinned())
                        .build())
                .toList();

        ProjectDocumentsDto.LibraryDto library = ProjectDocumentsDto.LibraryDto.builder()
                .title("PROJECT LIBRARY")
                .categories(List.of("All", "Notes", "Plans", "Design", "Other"))
                .activeCategory("All")
                .documents(docDtos)
                .build();

        ProjectDocument activeDoc = docs.stream().filter(d -> Boolean.TRUE.equals(d.isPinned())).findFirst()
                .orElse(null);
        if (activeDoc == null && !docs.isEmpty()) {
            activeDoc = docs.get(0);
        }
        ProjectDocumentsDto.DocumentViewerDto viewer = null;
        if (activeDoc != null) {
            viewer = ProjectDocumentsDto.DocumentViewerDto.builder()
                    .docNumber(activeDoc.getDocNumber())
                    .title(activeDoc.getTitle())
                    .category(activeDoc.getCategory())
                    .date(LocalDate.now(ZoneId.systemDefault()).format(DATE_FMT_D_MMM_YYYY))
                    .team(project.getName())
                    .savedStatus("Saved 2 minutes ago")
                    .discussionParagraph1(activeDoc.getContent() != null ? activeDoc.getContent()
                            : "We reviewed the latest designs and project direction.")
                    .discussionHighlighted(
                            "We also agreed to simplify the navigation and reduce unnecessary interface controls.")
                    .discussionParagraph2Remainder(" The revised approach will improve usability and content strategy.")
                    .collaborators(List.of())
                    .attendees(List.of())
                    .build();
        }

        String dueStr = project.getDueDate() != null
                ? project.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                : DEFAULT_DUE_DATE;
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : DEFAULT_TEAM_NAME;

        return ProjectDocumentsDto.builder()
                .id(project.getId().toString())
                .breadcrumb(BREADCRUMB_PROJECTS_PREFIX + project.getName().toUpperCase())
                .title(project.getName())
                .owner(ownerStr)
                .dueDate(dueStr)
                .status(project.getStatus() != null ? project.getStatus().name() : STATUS_LABEL_ACTIVE)
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
            if (!projs.isEmpty()) {
                project = projs.get(0);
            }
        }
        if (project == null) {
            throw new ResourceNotFoundException("Project not found: " + projectId);
        }

        Organization org = project.getOrganization();
        final String projectName = project.getName() != null ? project.getName() : "Team";

        List<ActivityEvent> events = activityEventRepository
                .findByOrganizationIdAndProjectIdOrderByEventTimestampDesc(org.getId(), project.getId());

        ZoneId zone = ZoneId.systemDefault();
        DateTimeFormatter fullDateFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd").withZone(zone);

        ActivityCounts counts = new ActivityCounts();
        Map<String, List<ActivityEvent>> groupedByDate = groupActivityEventsByDate(events, fullDateFmt, counts);

        List<ProjectActivityDto.ActivityDateGroupDto> dateGroups = buildActivityDateGroups(groupedByDate, projectName, zone);

        ProjectActivityDto.SinceLastVisitDto sinceLastVisit = ProjectActivityDto.SinceLastVisitDto.builder()
                .count(counts.important)
                .title(counts.important + " important updates since your last visit")
                .description("Includes milestone completions, mentions, and key decisions.")
                .actionLabel("Dismiss")
                .build();

        ProjectActivityDto.ActivityFilterCountsDto filterCounts = ProjectActivityDto.ActivityFilterCountsDto.builder()
                .milestones(counts.milestones)
                .decisions(counts.decisions)
                .taskUpdates(counts.tasks)
                .documentActivity(counts.docs)
                .comments(counts.comments)
                .filesAndAttachments(counts.files)
                .mentions(counts.mentions)
                .build();

        String dueStr = project.getDueDate() != null
                ? project.getDueDate().format(DATE_FMT_D_MMM_YYYY)
                : DEFAULT_DUE_DATE;
        String ownerStr = project.getOwner() != null ? project.getOwner().getFullName() : DEFAULT_TEAM_NAME;

        return ProjectActivityDto.builder()
                .id(project.getId().toString())
                .breadcrumb(BREADCRUMB_PROJECTS_PREFIX + project.getName().toUpperCase())
                .title(project.getName())
                .owner(ownerStr)
                .dueDate(dueStr)
                .status(project.getStatus() != null ? project.getStatus().name() : STATUS_LABEL_ACTIVE)
                .sinceLastVisit(sinceLastVisit)
                .filterCounts(filterCounts)
                .dateGroups(dateGroups)
                .build();
    }

    private static class ActivityCounts {
        int milestones;
        int decisions;
        int tasks;
        int docs;
        int comments;
        int files;
        int mentions;
        int important;
    }

    private Map<String, List<ActivityEvent>> groupActivityEventsByDate(
            List<ActivityEvent> events, DateTimeFormatter fullDateFmt, ActivityCounts counts) {
        Map<String, List<ActivityEvent>> groupedByDate = new LinkedHashMap<>();
        for (ActivityEvent e : events) {
            Instant ts = e.getEventTimestamp() != null ? e.getEventTimestamp() : Instant.now();
            String dateKey = fullDateFmt.format(ts);
            groupedByDate.computeIfAbsent(dateKey, k -> new ArrayList<>()).add(e);

            tallyActivityEvent(e, counts);
        }
        return groupedByDate;
    }

    private void tallyActivityEvent(ActivityEvent e, ActivityCounts counts) {
        String catKey = e.getCategoryKey() != null ? e.getCategoryKey().toLowerCase() : "";
        switch (catKey) {
            case "milestones" -> counts.milestones++;
            case "decisions" -> counts.decisions++;
            case "tasks" -> counts.tasks++;
            case "documents" -> counts.docs++;
            case "comments" -> counts.comments++;
            case "files" -> counts.files++;
            default -> { /* other categories ignored */ }
        }
        if (e.isMention()) {
            counts.mentions++;
        }
        if (e.isImportant()) {
            counts.important++;
        }
    }

    private List<ProjectActivityDto.ActivityDateGroupDto> buildActivityDateGroups(
            Map<String, List<ActivityEvent>> groupedByDate, String projectName, ZoneId zone) {
        LocalDate today = LocalDate.now(zone);
        LocalDate yesterday = today.minusDays(1);

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(zone);
        DateTimeFormatter dayNumFmt = DateTimeFormatter.ofPattern("dd").withZone(zone);
        DateTimeFormatter monthYearFmt = DateTimeFormatter.ofPattern("MMM yyyy").withZone(zone);
        DateTimeFormatter weekdayFmt = DateTimeFormatter.ofPattern("EEE").withZone(zone);

        List<ProjectActivityDto.ActivityDateGroupDto> dateGroups = new ArrayList<>();
        for (Map.Entry<String, List<ActivityEvent>> entry : groupedByDate.entrySet()) {
            String fullDate = entry.getKey();
            List<ActivityEvent> dayEvents = entry.getValue();
            Instant firstTs = dayEvents.get(0).getEventTimestamp() != null ? dayEvents.get(0).getEventTimestamp()
                    : Instant.now();
            LocalDate eventLocalDate = LocalDate.ofInstant(firstTs, zone);

            String weekday = resolveWeekdayLabel(eventLocalDate, today, yesterday, weekdayFmt, firstTs);

            List<ProjectActivityDto.ActivityEventDto> eventDtos = dayEvents.stream()
                    .map(e -> mapToActivityEventDto(e, timeFmt, projectName))
                    .toList();

            dateGroups.add(ProjectActivityDto.ActivityDateGroupDto.builder()
                    .dayNumber(dayNumFmt.format(firstTs))
                    .monthYear(monthYearFmt.format(firstTs).toUpperCase())
                    .weekday(weekday)
                    .fullDate(fullDate)
                    .events(eventDtos)
                    .build());
        }
        return dateGroups;
    }

    private String resolveWeekdayLabel(LocalDate eventDate, LocalDate today, LocalDate yesterday,
                                       DateTimeFormatter weekdayFmt, Instant firstTs) {
        if (eventDate.equals(today)) {
            return "TODAY";
        }
        if (eventDate.equals(yesterday)) {
            return "YESTERDAY";
        }
        return weekdayFmt.format(firstTs).toUpperCase();
    }

    private ProjectActivityDto.ActivityEventDto mapToActivityEventDto(
            ActivityEvent e, DateTimeFormatter timeFmt, String projectName) {
        Instant et = e.getEventTimestamp() != null ? e.getEventTimestamp() : Instant.now();
        String actorName = (e.getActor() != null && e.getActor().getFullName() != null)
                ? e.getActor().getFullName() : "Team Member";
        String initials = computeInitials(actorName, "TD");

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
                .userTeam(projectName)
                .avatarColor("#3B82F6")
                .actionLabel(e.getActionLabel())
                .actionType(e.getActionType())
                .actionTargetId(e.getActionTargetId())
                .isImportant(e.isImportant())
                .isMention(e.isMention())
                .build();
    }

    @Transactional(readOnly = true)
    public List<PinnedProjectDto> getPinnedProjectsForCurrentUser() {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();

        List<UserPinnedProject> pinned = userPinnedProjectRepository
                .findByUserIdAndOrganizationIdWithProject(currentUser.getId(), organization.getId());

        return pinned.stream()
                .filter(upp -> upp.getProject() != null)
                .map(upp -> {
                    Project p = upp.getProject();
                    String status = p.getStatus() != null ? p.getStatus().name() : STATUS_ACTIVE;
                    String statusDot = resolveProjectStatusDotColor(status);
                    return PinnedProjectDto.builder()
                            .id(p.getId().toString())
                            .name(p.getName())
                            .status(status)
                            .statusLabel(status.replace("_", " "))
                            .statusDotColor(statusDot)
                            .url("/pages/projects/project-detail/project-detail.html?id=" + p.getId())
                            .sortOrder(upp.getSortOrder())
                            .build();
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<OngoingProjectOptionDto> getOngoingProjectsAvailableForPinning() {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();

        List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(organization.getId());
        List<UserPinnedProject> pinnedList = userPinnedProjectRepository
                .findByUserIdAndOrganizationIdWithProject(currentUser.getId(), organization.getId());

        Set<UUID> pinnedProjectIds = pinnedList.stream()
                .filter(upp -> upp.getProject() != null)
                .map(upp -> upp.getProject().getId())
                .collect(Collectors.toSet());

        return allProjects.stream()
                .filter(p -> p.getStatus() != ProjectStatus.COMPLETED && p.getStatus() != ProjectStatus.CANCELLED)
                .map(p -> {
                    String status = p.getStatus() != null ? p.getStatus().name() : STATUS_ACTIVE;
                    String statusDot = resolveProjectStatusDotColor(status);
                    return OngoingProjectOptionDto.builder()
                            .id(p.getId().toString())
                            .name(p.getName())
                            .status(status)
                            .statusLabel(status.replace("_", " "))
                            .statusDotColor(statusDot)
                            .isPinned(pinnedProjectIds.contains(p.getId()))
                            .build();
                })
                .toList();
    }

    @Transactional
    public PinnedProjectDto pinProjectForCurrentUser(UUID projectId) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();

        Project project = projectRepository.findByIdAndOrganizationId(projectId, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        if (project.getStatus() == ProjectStatus.COMPLETED || project.getStatus() == ProjectStatus.CANCELLED) {
            throw new BadRequestException("Only ongoing projects can be pinned");
        }

        Optional<UserPinnedProject> existing = userPinnedProjectRepository
                .findByUserIdAndProjectId(currentUser.getId(), projectId);

        UserPinnedProject upp;
        if (existing.isPresent()) {
            upp = existing.get();
        } else {
            long currentCount = userPinnedProjectRepository.countByUserIdAndOrganizationId(currentUser.getId(), organization.getId());
            upp = UserPinnedProject.builder()
                    .id(UUID.randomUUID())
                    .organization(organization)
                    .user(currentUser)
                    .project(project)
                    .sortOrder((int) currentCount)
                    .build();
            upp = userPinnedProjectRepository.save(upp);
        }

        String status = project.getStatus() != null ? project.getStatus().name() : STATUS_ACTIVE;
        String statusDot = resolveProjectStatusDotColor(status);

        return PinnedProjectDto.builder()
                .id(project.getId().toString())
                .name(project.getName())
                .status(status)
                .statusLabel(status.replace("_", " "))
                .statusDotColor(statusDot)
                .url("/pages/projects/project-detail/project-detail.html?id=" + project.getId())
                .sortOrder(upp.getSortOrder())
                .build();
    }

    @Transactional
    public void unpinProjectForCurrentUser(UUID projectId) {
        resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();
        userPinnedProjectRepository.deleteByUserIdAndProjectId(currentUser.getId(), projectId);
    }
}
