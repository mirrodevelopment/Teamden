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

            ensureBaselineProjects(organization, currentUser);

            List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(organization.getId());

            LocalDate today = LocalDate.now();
            String dayOfWeek = today.getDayOfWeek().name().substring(0, 3);
            String month = today.getMonth().name().substring(0, 3);
            String year = String.valueOf(today.getYear());
            String dayNum = String.format("%02d", today.getDayOfMonth());
            String formattedDate = dayOfWeek + ", " + dayNum + " " + month + " " + year;

            long totalCount = Math.max(allProjects.size(), 12L);
            long activeCount = allProjects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count();
            if (activeCount == 0) activeCount = 8;
            else activeCount = Math.max(activeCount, 8L);

            long atRiskCount = 2;
            long dueSoonCount = 3;

            // Featured Project ("Website Redesign")
            ProjectItemDto featured = ProjectItemDto.builder()
                    .id("featured-01")
                    .indexNum("01")
                    .name("Website Redesign")
                    .description("Deliver a responsive, approved website ready for production.")
                    .status("ACTIVE")
                    .statusLabel("ACTIVE")
                    .statusDotColor("green")
                    .health("AT_RISK")
                    .healthLabel("AT RISK")
                    .healthDotColor("red")
                    .team("Design Team")
                    .dueDate("Due 15 Nov 2026")
                    .priority("High Priority")
                    .milestonesLabel("06/09")
                    .milestonesCompleted(6)
                    .milestonesTotal(9)
                    .blockersCount(2)
                    .avatars(List.of("PK", "AR", "SK"))
                    .avatarOverflow("+2")
                    .build();

            // Project Cards
            List<ProjectItemDto> projectDtos = new ArrayList<>();

            projectDtos.add(ProjectItemDto.builder()
                    .id("proj-02")
                    .indexNum("02")
                    .name("Client Application")
                    .description("Develop and launch the patient application with core tracking features.")
                    .status("ACTIVE")
                    .statusLabel("ACTIVE")
                    .statusDotColor("green")
                    .health("ON_TRACK")
                    .healthLabel("ON TRACK")
                    .healthDotColor("green")
                    .team("Engineering")
                    .dueDate("Due 18 Oct 2026")
                    .milestonesLabel("3/5 milestones")
                    .milestonesCompleted(3)
                    .milestonesTotal(5)
                    .avatars(List.of("PK", "AR", "SK"))
                    .avatarOverflow("+2")
                    .build());

            projectDtos.add(ProjectItemDto.builder()
                    .id("proj-03")
                    .indexNum("03")
                    .name("Brand Development")
                    .description("Create a unified brand identity across all products.")
                    .status("IN_REVIEW")
                    .statusLabel("IN REVIEW")
                    .statusDotColor("blue")
                    .health("ON_TRACK")
                    .healthLabel("ON TRACK")
                    .healthDotColor("green")
                    .team("Design")
                    .dueDate("Due 30 Oct 2026")
                    .milestonesLabel("4/6 milestones")
                    .milestonesCompleted(4)
                    .milestonesTotal(6)
                    .avatars(List.of("MJ", "PK", "SD"))
                    .avatarOverflow("+2")
                    .build());

            projectDtos.add(ProjectItemDto.builder()
                    .id("proj-04")
                    .indexNum("04")
                    .name("Marketing Campaign")
                    .description("Plan and execute product launch campaign.")
                    .status("ACTIVE")
                    .statusLabel("ACTIVE")
                    .statusDotColor("green")
                    .health("AT_RISK")
                    .healthLabel("AT RISK")
                    .healthDotColor("red")
                    .team("Marketing")
                    .dueDate("Due 27 Oct 2026")
                    .milestonesLabel("2/4 milestones")
                    .milestonesCompleted(2)
                    .milestonesTotal(4)
                    .avatars(List.of("AR", "SK", "JR"))
                    .avatarOverflow("+2")
                    .build());

            projectDtos.add(ProjectItemDto.builder()
                    .id("proj-05")
                    .indexNum("05")
                    .name("Product Roadmap")
                    .description("Define product strategy for next 12 months.")
                    .status("PLANNING")
                    .statusLabel("PLANNING")
                    .statusDotColor("orange")
                    .health("ON_TRACK")
                    .healthLabel("ON TRACK")
                    .healthDotColor("green")
                    .team("Product")
                    .dueDate("Due 10 Nov 2026")
                    .milestonesLabel("1/4 milestones")
                    .milestonesCompleted(1)
                    .milestonesTotal(4)
                    .avatars(List.of("PB", "MH", "AR"))
                    .avatarOverflow("+2")
                    .build());

            projectDtos.add(ProjectItemDto.builder()
                    .id("proj-06")
                    .indexNum("06")
                    .name("Internal Tools")
                    .description("Improve internal tools for operations and finance.")
                    .status("ACTIVE")
                    .statusLabel("ACTIVE")
                    .statusDotColor("green")
                    .health("ON_TRACK")
                    .healthLabel("ON TRACK")
                    .healthDotColor("green")
                    .team("Operations")
                    .dueDate("Due 12 Dec 2026")
                    .milestonesLabel("2/5 milestones")
                    .milestonesCompleted(2)
                    .milestonesTotal(5)
                    .avatars(List.of("SK", "JR", "MK"))
                    .avatarOverflow("+2")
                    .build());

            projectDtos.add(ProjectItemDto.builder()
                    .id("proj-07")
                    .indexNum("07")
                    .name("Content Library")
                    .description("Build and organize all product content.")
                    .status("ON_HOLD")
                    .statusLabel("ON HOLD")
                    .statusDotColor("gray")
                    .health("AT_RISK")
                    .healthLabel("AT RISK")
                    .healthDotColor("red")
                    .team("Content")
                    .dueDate("Due 20 Nov 2026")
                    .milestonesLabel("3/5 milestones")
                    .milestonesCompleted(3)
                    .milestonesTotal(5)
                    .avatars(List.of("MH", "SD", "AR"))
                    .avatarOverflow("+2")
                    .build());

            // Append any user-created custom projects from the DB
            int customIdx = 8;
            for (Project p : allProjects) {
                boolean alreadyListed = projectDtos.stream().anyMatch(d -> d.getName().equalsIgnoreCase(p.getName()))
                        || featured.getName().equalsIgnoreCase(p.getName());
                if (!alreadyListed) {
                    String stat = p.getStatus() != null ? p.getStatus().name() : "ACTIVE";
                    String statLbl = stat.replace("_", " ");
                    String dueLbl = p.getDueDate() != null ? "Due " + p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy")) : "Upcoming";
                    projectDtos.add(ProjectItemDto.builder()
                            .id(p.getId().toString())
                            .indexNum(String.format("%02d", customIdx++))
                            .name(p.getName())
                            .description(p.getDescription() != null ? p.getDescription() : "Custom project workspace")
                            .status(stat)
                            .statusLabel(statLbl)
                            .statusDotColor(stat.equals("ACTIVE") ? "green" : stat.equals("COMPLETED") ? "blue" : "gray")
                            .health("ON_TRACK")
                            .healthLabel("ON TRACK")
                            .healthDotColor("green")
                            .team(p.getOwner() != null ? p.getOwner().getFullName() : "Team")
                            .dueDate(dueLbl)
                            .milestonesLabel("1/3 milestones")
                            .milestonesCompleted(1)
                            .milestonesTotal(3)
                            .avatars(List.of("TM"))
                            .avatarOverflow("")
                            .build());
                }
            }

            // Decisions Required
            List<DecisionItemDto> decisions = List.of(
                    DecisionItemDto.builder()
                            .id("dec-1")
                            .projectTag("WEBSITE REDESIGN")
                            .title("Brand Development")
                            .subTitle("Identity approval")
                            .dueDate("Due 30 Oct 2026")
                            .indicatorColor("amber")
                            .hasAction(true)
                            .actionLabel("Review →")
                            .build(),
                    DecisionItemDto.builder()
                            .id("dec-2")
                            .projectTag("MARKETING CAMPAIGN")
                            .title("Marketing Campaign")
                            .subTitle("Budget sign-off")
                            .dueDate("Due 27 Oct 2026")
                            .indicatorColor("red")
                            .hasAction(false)
                            .build(),
                    DecisionItemDto.builder()
                            .id("dec-3")
                            .projectTag("PRODUCT ROADMAP")
                            .title("Product Roadmap")
                            .subTitle("Strategy approval")
                            .dueDate("Due 10 Nov 2026")
                            .indicatorColor("amber")
                            .hasAction(false)
                            .build()
            );

            // Project Attention
            List<ProjectAttentionDto> attention = List.of(
                    ProjectAttentionDto.builder()
                            .id("att-1")
                            .indexNum("01")
                            .statusType("BLOCKED")
                            .statusDot("red")
                            .metaLabel("2 blockers")
                            .projectName("Client Application")
                            .detail("2 blockers require input")
                            .dateLabel("Since 18 Oct 2026")
                            .build(),
                    ProjectAttentionDto.builder()
                            .id("att-2")
                            .indexNum("02")
                            .statusType("DELAY")
                            .statusDot("orange")
                            .metaLabel("At risk")
                            .projectName("Brand Development")
                            .detail("Design approval pending")
                            .dateLabel("Due 30 Oct 2026")
                            .build(),
                    ProjectAttentionDto.builder()
                            .id("att-3")
                            .indexNum("03")
                            .statusType("RESOURCE")
                            .statusDot("blue")
                            .metaLabel("Needs follow-up")
                            .projectName("Content Library")
                            .detail("Delayed by 2 days")
                            .dateLabel("Due 20 Nov 2026")
                            .build()
            );

            // Upcoming Milestones
            List<UpcomingMilestoneDto> milestones = List.of(
                    UpcomingMilestoneDto.builder().id("m-1").dateDayMonth("27 OCT").dotColor("green").title("Brand Guidelines").subTitle("Final design review").build(),
                    UpcomingMilestoneDto.builder().id("m-2").dateDayMonth("30 OCT").dotColor("green").title("Client Application").subTitle("Beta build release").build(),
                    UpcomingMilestoneDto.builder().id("m-3").dateDayMonth("02 NOV").dotColor("amber").title("Marketing Campaign").subTitle("Campaign assets ready").build(),
                    UpcomingMilestoneDto.builder().id("m-4").dateDayMonth("05 NOV").dotColor("red").title("Website Redesign").subTitle("Client approval").build(),
                    UpcomingMilestoneDto.builder().id("m-5").dateDayMonth("10 NOV").dotColor("black").title("Product Roadmap").subTitle("Strategy presentation").build()
            );

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

    @Transactional
    public void ensureProjectFlowBaseline(Project project, User currentUser) {
        if (project == null || project.getId() == null) return;

        Organization org = project.getOrganization();

        // 1. Milestones
        List<ProjectMilestone> milestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(project.getId());
        if (milestones.isEmpty()) {
            List<ProjectMilestone> baselineMilestones = List.of(
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(1).code("01").name("Discovery").status(MilestoneStatus.COMPLETED).statusLabel("Completed").dueDate(LocalDate.now().minusDays(30)).completedAt(Instant.now().minusSeconds(86400 * 30)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(2).code("02").name("Design").status(MilestoneStatus.COMPLETED).statusLabel("Completed").dueDate(LocalDate.now().minusDays(20)).completedAt(Instant.now().minusSeconds(86400 * 20)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(3).code("03").name("Development").status(MilestoneStatus.COMPLETED).statusLabel("Completed").dueDate(LocalDate.now().minusDays(15)).completedAt(Instant.now().minusSeconds(86400 * 15)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(4).code("04").name("Testing").status(MilestoneStatus.COMPLETED).statusLabel("Completed").dueDate(LocalDate.now().minusDays(10)).completedAt(Instant.now().minusSeconds(86400 * 10)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(5).code("05").name("Content").status(MilestoneStatus.COMPLETED).statusLabel("Completed").dueDate(LocalDate.now().minusDays(5)).completedAt(Instant.now().minusSeconds(86400 * 5)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(6).code("06").name("Review").status(MilestoneStatus.CURRENT).statusLabel("In Progress").dueDate(LocalDate.now().plusDays(7)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(7).code("07").name("Launch Prep").status(MilestoneStatus.UPCOMING).statusLabel("Upcoming").dueDate(LocalDate.now().plusDays(15)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(8).code("08").name("Go Live").status(MilestoneStatus.UPCOMING).statusLabel("Upcoming").dueDate(LocalDate.now().plusDays(25)).build(),
                    ProjectMilestone.builder().id(UUID.randomUUID()).organization(org).project(project).seqNum(9).code("09").name("Post Launch").status(MilestoneStatus.UPCOMING).statusLabel("Upcoming").dueDate(LocalDate.now().plusDays(40)).build()
            );
            projectMilestoneRepository.saveAll(baselineMilestones);
            milestones = baselineMilestones;
        }

        // 2. Specifications
        if (projectSpecificationRepository.findByProjectId(project.getId()).isEmpty()) {
            ProjectSpecification spec = ProjectSpecification.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .project(project)
                    .title("Build a better digital experience.")
                    .objectives("Improve user experience\nIncrease conversion rate\nStrengthen brand presence")
                    .deliverables("Responsive website (desktop, tablet, mobile)\nCMS implementation\nContent migration")
                    .successCriteria("Higher engagement\nIncreased conversion rate\nMeets accessibility standards")
                    .clientName("Acme Co.")
                    .focusArea("Brand, performance and growth")
                    .build();
            projectSpecificationRepository.save(spec);
        }

        // 3. Decisions
        List<ProjectDecision> decisions = projectDecisionRepository.findByProjectIdWithDecider(project.getId());
        if (decisions.isEmpty()) {
            List<ProjectDecision> baselineDecisions = List.of(
                    ProjectDecision.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .decisionCode("DEC-01")
                            .title("Homepage design approval")
                            .subTitle("Identity approval")
                            .description("Final design requires your review before development continues.")
                            .status(DecisionStatus.PENDING)
                            .dueDate(LocalDate.now().plusDays(4))
                            .decider(currentUser)
                            .actionLabel("Review →")
                            .actionUrl("#review")
                            .indicatorColor("amber")
                            .build(),
                    ProjectDecision.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .decisionCode("DEC-02")
                            .title("Marketing Campaign")
                            .subTitle("Budget sign-off")
                            .description("Review marketing allocation and asset timeline.")
                            .status(DecisionStatus.PENDING)
                            .dueDate(LocalDate.now().plusDays(2))
                            .decider(currentUser)
                            .indicatorColor("red")
                            .build(),
                    ProjectDecision.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .decisionCode("DEC-03")
                            .title("Product Roadmap")
                            .subTitle("Strategy approval")
                            .description("Quarterly roadmap sign-off.")
                            .status(DecisionStatus.PENDING)
                            .dueDate(LocalDate.now().plusDays(14))
                            .decider(currentUser)
                            .indicatorColor("amber")
                            .build()
            );
            projectDecisionRepository.saveAll(baselineDecisions);
        }

        // 4. Documents
        List<ProjectDocument> docs = projectDocumentRepository.findByProjectIdWithAuthor(project.getId());
        if (docs.isEmpty()) {
            List<ProjectDocument> baselineDocs = List.of(
                    ProjectDocument.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .docNumber("DOCUMENT / 003")
                            .title("Design Review Notes")
                            .category("Meeting Notes")
                            .categoryKey("Notes")
                            .fileType("DOC")
                            .fileSize("850 KB")
                            .author(currentUser)
                            .isPinned(true)
                            .content("We reviewed the latest homepage designs and discussed the overall structure, navigation and visual direction.")
                            .build(),
                    ProjectDocument.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .docNumber("DOCUMENT / 001")
                            .title("Project Brief")
                            .category("Foundation")
                            .categoryKey("Plans")
                            .fileType("PDF")
                            .fileSize("1.2 MB")
                            .author(currentUser)
                            .content("Project brief and foundation document.")
                            .build(),
                    ProjectDocument.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .docNumber("DOCUMENT / 002")
                            .title("Design Guidelines")
                            .category("Reference")
                            .categoryKey("Design")
                            .fileType("FIGMA")
                            .fileSize("24 MB")
                            .author(currentUser)
                            .content("Brand guidelines and design token references.")
                            .build()
            );
            projectDocumentRepository.saveAll(baselineDocs);
        }

        // 5. Project Members
        List<ProjectMember> members = projectMemberRepository.findByProjectIdWithUser(project.getId());
        if (members.isEmpty()) {
            projectMemberRepository.save(ProjectMember.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .project(project)
                    .user(currentUser)
                    .role("LEAD")
                    .build());
        }

        // 6. Baseline Tasks
        List<Task> existingTasks = taskRepository.findByProjectIdWithDetails(project.getId());
        if (existingTasks.isEmpty()) {
            ProjectMilestone currentMilestone = milestones.stream()
                    .filter(m -> m.getStatus() == MilestoneStatus.CURRENT)
                    .findFirst()
                    .orElse(milestones.get(0));

            List<Task> baselineTasks = List.of(
                    Task.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .milestone(currentMilestone)
                            .taskCode("T-014")
                            .title("Homepage development")
                            .description("Implement homepage responsive layouts and UI components.")
                            .assignee(currentUser)
                            .creator(currentUser)
                            .priority(TaskPriority.HIGH)
                            .status(TaskStatus.IN_PROGRESS)
                            .dueDate(LocalDate.now().plusDays(2))
                            .isBlocked(true)
                            .blockerReason("Waiting for design approval")
                            .subtasksCount(3)
                            .build(),
                    Task.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .milestone(currentMilestone)
                            .taskCode("T-026")
                            .title("Mobile optimisation")
                            .description("Ensure touch targets and responsiveness across devices.")
                            .assignee(currentUser)
                            .creator(currentUser)
                            .priority(TaskPriority.MEDIUM)
                            .status(TaskStatus.IN_PROGRESS)
                            .dueDate(LocalDate.now().plusDays(5))
                            .isBlocked(false)
                            .subtasksCount(2)
                            .build(),
                    Task.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .milestone(currentMilestone)
                            .taskCode("T-028")
                            .title("CMS implementation")
                            .description("Set up headless CMS and editorial content types.")
                            .assignee(currentUser)
                            .creator(currentUser)
                            .priority(TaskPriority.MEDIUM)
                            .status(TaskStatus.TODO)
                            .dueDate(LocalDate.now().plusDays(10))
                            .isBlocked(false)
                            .subtasksCount(4)
                            .build(),
                    Task.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .milestone(currentMilestone)
                            .taskCode("T-031")
                            .title("Analytics setup")
                            .description("Integrate analytics telemetry and dashboards.")
                            .assignee(currentUser)
                            .creator(currentUser)
                            .priority(TaskPriority.LOW)
                            .status(TaskStatus.TODO)
                            .dueDate(LocalDate.now().plusDays(12))
                            .isBlocked(false)
                            .subtasksCount(2)
                            .build(),
                    Task.builder()
                            .id(UUID.randomUUID())
                            .organization(org)
                            .project(project)
                            .milestone(currentMilestone)
                            .taskCode("T-035")
                            .title("SEO optimisation")
                            .description("Metadata, OpenGraph tags and sitemap generation.")
                            .assignee(currentUser)
                            .creator(currentUser)
                            .priority(TaskPriority.MEDIUM)
                            .status(TaskStatus.IN_REVIEW)
                            .dueDate(LocalDate.now().plusDays(14))
                            .isBlocked(false)
                            .subtasksCount(3)
                            .build()
            );
            taskRepository.saveAll(baselineTasks);
        }

        // 7. Project Chronicle Activity Events
        if (activityEventRepository.countByOrganizationIdAndProjectId(org.getId(), project.getId()) == 0) {
            ensureProjectActivityBaseline(project, currentUser);
        }
    }

    private void ensureProjectActivityBaseline(Project project, User user) {
        Organization org = project.getOrganization();
        Instant now = Instant.now();

        List<ActivityEvent> chronicle = List.of(
                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .project(project)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_COMPLETED)
                        .entityType("MILESTONE")
                        .title("Design approved.")
                        .description("Milestone 05 / Design has been completed and work can proceed to the next stage.")
                        .categoryKey("milestones")
                        .badgeType("MILESTONE COMPLETED")
                        .dotColor("lime")
                        .iconType("flag")
                        .iconBgClass("icon-bg-lime")
                        .actionLabel("View milestone ↗")
                        .actionType("milestone")
                        .actionTargetId("ms-05")
                        .isImportant(true)
                        .isMention(false)
                        .eventTimestamp(now.minusSeconds(3600 * 3))
                        .build(),

                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .project(project)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_CREATED)
                        .entityType("COMMENT")
                        .title("Alex R. commented on Design Review Notes.")
                        .description("\"The navigation direction looks good. Please refine the mobile interaction.\"")
                        .categoryKey("comments")
                        .badgeType("COMMENT")
                        .dotColor("amber")
                        .iconType("comment")
                        .iconBgClass("icon-bg-amber")
                        .actionLabel("Open discussion ↗")
                        .actionType("comment")
                        .actionTargetId("doc-01")
                        .isImportant(true)
                        .isMention(true)
                        .eventTimestamp(now.minusSeconds(3600 * 5))
                        .build(),

                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .project(project)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_STATUS_CHANGED)
                        .entityType("TASK")
                        .title("Homepage development moved to In Progress.")
                        .description("Status changed from")
                        .categoryKey("tasks")
                        .badgeType("TASK UPDATED")
                        .dotColor("blue")
                        .iconType("check-circle")
                        .iconBgClass("icon-bg-blue")
                        .statusFrom("To Do")
                        .statusTo("In Progress")
                        .actionLabel("View task ↗")
                        .actionType("task")
                        .actionTargetId("T-014")
                        .isImportant(true)
                        .isMention(false)
                        .eventTimestamp(now.minusSeconds(3600 * 6))
                        .build(),

                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .project(project)
                        .actor(user)
                        .eventType(ActivityEventType.PROJECT_UPDATED)
                        .entityType("DOCUMENT")
                        .title("Design Review Notes updated.")
                        .description("Version 2.3 · 5 changes")
                        .categoryKey("documents")
                        .badgeType("DOCUMENT UPDATED")
                        .dotColor("purple")
                        .iconType("document")
                        .iconBgClass("icon-bg-purple")
                        .actionLabel("View changes ↗")
                        .actionType("document")
                        .actionTargetId("doc-01")
                        .isImportant(true)
                        .isMention(false)
                        .eventTimestamp(now.minusSeconds(86400 + 3600 * 2))
                        .build(),

                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .project(project)
                        .actor(user)
                        .eventType(ActivityEventType.TASK_COMPLETED)
                        .entityType("DECISION")
                        .title("Homepage layout approved (pending client confirmation).")
                        .description("Awaiting final client sign-off.")
                        .categoryKey("decisions")
                        .badgeType("DECISION RECORDED")
                        .dotColor("amber")
                        .iconType("decision")
                        .iconBgClass("icon-bg-amber")
                        .actionLabel("View decision ↗")
                        .actionType("decision")
                        .actionTargetId("dec-01")
                        .isImportant(true)
                        .isMention(false)
                        .eventTimestamp(now.minusSeconds(86400 + 3600 * 6))
                        .build(),

                ActivityEvent.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .project(project)
                        .actor(user)
                        .eventType(ActivityEventType.PROJECT_UPDATED)
                        .entityType("FILE")
                        .title("Added file to Project Brief.")
                        .description("homepage-wireframes-v2.fig · 12 MB")
                        .categoryKey("files")
                        .badgeType("FILE ADDED")
                        .dotColor("gray")
                        .iconType("attachment")
                        .iconBgClass("icon-bg-gray")
                        .actionLabel("Open document ↗")
                        .actionType("file")
                        .actionTargetId("doc-02")
                        .isImportant(false)
                        .isMention(false)
                        .eventTimestamp(now.minusSeconds(86400 + 3600 * 8))
                        .build()
        );

        activityEventRepository.saveAll(chronicle);
    }

    private void ensureBaselineProjects(Organization org, User user) {
        List<Project> existing = projectRepository.findByOrganizationIdWithDetails(org.getId());
        if (existing.size() >= 3) {
            return;
        }

        List<String> names = List.of(
                "Website Redesign",
                "Client Application",
                "Brand Development",
                "Marketing Campaign",
                "Product Roadmap",
                "Internal Tools",
                "Content Library"
        );

        for (String name : names) {
            boolean exists = existing.stream().anyMatch(p -> p.getName().equalsIgnoreCase(name));
            if (!exists) {
                Project p = Project.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .name(name)
                        .owner(user)
                        .status(name.equals("Brand Development") ? ProjectStatus.ACTIVE
                                : name.equals("Product Roadmap") ? ProjectStatus.PLANNING
                                : name.equals("Content Library") ? ProjectStatus.ON_HOLD
                                : ProjectStatus.ACTIVE)
                        .health(name.equals("Marketing Campaign") || name.equals("Content Library") ? "AT_RISK" : "ON_TRACK")
                        .priority(name.equals("Website Redesign") ? "HIGH" : "MEDIUM")
                        .projectType(name.equals("Website Redesign") ? "Design / Development" : "General")
                        .startDate(LocalDate.now())
                        .dueDate(LocalDate.now().plusDays(30))
                        .build();
                p = projectRepository.save(p);
                if (name.equals("Website Redesign")) {
                    ensureProjectFlowBaseline(p, user);
                }
            }
        }
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
        if (orgProjects.isEmpty()) {
            User currentUser = resolveCurrentUser(org);
            ensureBaselineProjects(org, currentUser);
            orgProjects = projectRepository.findByOrganizationIdWithDetails(org.getId());
        }

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

        User currentUser = resolveCurrentUser(project.getOrganization());
        ensureProjectFlowBaseline(project, currentUser);

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

        User currentUser = resolveCurrentUser(project.getOrganization());
        ensureProjectFlowBaseline(project, currentUser);

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

        User currentUser = resolveCurrentUser(project.getOrganization());
        ensureProjectFlowBaseline(project, currentUser);

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
            User currentUser = resolveCurrentUser(organization);
            ensureBaselineProjects(organization, currentUser);
            List<Project> projs = projectRepository.findByOrganizationIdWithDetails(organization.getId());
            project = projs.isEmpty() ? null : projs.get(0);
        }
        if (project == null) {
            throw new ResourceNotFoundException("Project not found: " + projectId);
        }

        Organization org = project.getOrganization();
        User currentUser = resolveCurrentUser(org);
        ensureProjectFlowBaseline(project, currentUser);

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
