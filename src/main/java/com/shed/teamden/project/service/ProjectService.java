package com.shed.teamden.project.service;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.dto.*;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          OrganizationRepository organizationRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
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
                // If it's already represented in the seed cards, skip duplicate
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
                .startDate(LocalDate.now())
                .dueDate(due != null ? due : LocalDate.now().plusDays(30))
                .build();

        newProject = projectRepository.save(newProject);

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
                .milestonesLabel("0/3 milestones")
                .milestonesCompleted(0)
                .milestonesTotal(3)
                .avatars(List.of("ME"))
                .avatarOverflow("")
                .build();
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
                        .startDate(LocalDate.now())
                        .dueDate(LocalDate.now().plusDays(30))
                        .build();
                projectRepository.save(p);
            }
        }
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

    public ProjectOverviewDto getProjectOverview(String projectId) {
        String projectName = "Website Redesign";
        String projectDesc = "Redesign the website into a responsive, modern experience with clearer navigation, stronger visual identity and an intuitive customer journey.";
        String projectOwner = "Design Team";
        String dueDate = "15 Nov 2026";
        String status = "ACTIVE";

        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID uuid = UUID.fromString(projectId);
                Optional<Project> pOpt = projectRepository.findById(uuid);
                if (pOpt.isPresent()) {
                    Project p = pOpt.get();
                    if (p.getName() != null) projectName = p.getName();
                    if (p.getDescription() != null) projectDesc = p.getDescription();
                    if (p.getOwner() != null) projectOwner = p.getOwner().getFullName();
                    if (p.getDueDate() != null) dueDate = p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy"));
                    if (p.getStatus() != null) status = p.getStatus().name();
                }
            } catch (Exception ignored) {
            }
        }

        return ProjectOverviewDto.createDefault(projectId, projectName, projectDesc, projectOwner, dueDate, status);
    }

    public ProjectTasksDto getProjectTasks(String projectId) {
        String projectName = "website redesign.";
        String projectOwner = "Design Team";
        String dueDate = "15 Nov 2026";
        String status = "ACTIVE";

        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID uuid = UUID.fromString(projectId);
                Optional<Project> pOpt = projectRepository.findById(uuid);
                if (pOpt.isPresent()) {
                    Project p = pOpt.get();
                    if (p.getName() != null) projectName = p.getName();
                    if (p.getOwner() != null) projectOwner = p.getOwner().getFullName();
                    if (p.getDueDate() != null) dueDate = p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy"));
                    if (p.getStatus() != null) status = p.getStatus().name();
                }
            } catch (Exception ignored) {
            }
        }

        return ProjectTasksDto.createDefault(projectId, projectName, projectOwner, dueDate, status);
    }

    public ProjectDocumentsDto getProjectDocuments(String projectId) {
        String projectName = "website redesign.";
        String projectOwner = "Design Team";
        String dueDate = "15 Nov 2026";
        String status = "ACTIVE";

        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID uuid = UUID.fromString(projectId);
                Optional<Project> pOpt = projectRepository.findById(uuid);
                if (pOpt.isPresent()) {
                    Project p = pOpt.get();
                    if (p.getName() != null) projectName = p.getName();
                    if (p.getOwner() != null) projectOwner = p.getOwner().getFullName();
                    if (p.getDueDate() != null) dueDate = p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy"));
                    if (p.getStatus() != null) status = p.getStatus().name();
                }
            } catch (Exception ignored) {
            }
        }

        return ProjectDocumentsDto.createDefault(projectId, projectName, projectOwner, dueDate, status);
    }

    public ProjectActivityDto getProjectActivity(String projectId) {
        String projectName = "website redesign.";
        String projectOwner = "Design Team";
        String dueDate = "15 Nov 2026";
        String status = "ACTIVE";

        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID uuid = UUID.fromString(projectId);
                Optional<Project> pOpt = projectRepository.findById(uuid);
                if (pOpt.isPresent()) {
                    Project p = pOpt.get();
                    if (p.getName() != null) projectName = p.getName();
                    if (p.getOwner() != null) projectOwner = p.getOwner().getFullName();
                    if (p.getDueDate() != null) dueDate = p.getDueDate().format(DateTimeFormatter.ofPattern("d MMM yyyy"));
                    if (p.getStatus() != null) status = p.getStatus().name();
                }
            } catch (Exception ignored) {
            }
        }

        return ProjectActivityDto.createDefault(projectId, projectName, projectOwner, dueDate, status);
    }
}
