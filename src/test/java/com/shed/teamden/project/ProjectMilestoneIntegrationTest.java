package com.shed.teamden.project;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectMilestone;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectMilestoneRepository;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.task.entity.KanbanColumn;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class ProjectMilestoneIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectMilestoneRepository projectMilestoneRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Organization orgAlpha;
    private Organization orgBeta;
    private User userAlpha;
    private User userBeta;
    private Project projectAlpha;
    private MockHttpSession sessionAlpha;
    private MockHttpSession sessionBeta;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        jdbcTemplate.execute("DELETE FROM task_linked_documents");
        jdbcTemplate.execute("DELETE FROM project_document_collaborators");
        jdbcTemplate.execute("DELETE FROM project_documents");
        jdbcTemplate.execute("DELETE FROM project_decisions");
        jdbcTemplate.execute("DELETE FROM project_specifications");
        jdbcTemplate.execute("DELETE FROM project_members");
        jdbcTemplate.execute("DELETE FROM task_subtasks");
        jdbcTemplate.execute("DELETE FROM activity_events");
        jdbcTemplate.execute("DELETE FROM tasks");
        jdbcTemplate.execute("DELETE FROM project_milestones");
        jdbcTemplate.execute("DELETE FROM attendance_records");
        jdbcTemplate.execute("DELETE FROM calendar_commitments");
        jdbcTemplate.execute("DELETE FROM calendar_needs_scheduling");
        jdbcTemplate.execute("DELETE FROM calendar_sources");
        jdbcTemplate.execute("DELETE FROM calendar_team_availability");
        jdbcTemplate.execute("DELETE FROM calendar_events");
        jdbcTemplate.execute("DELETE FROM projects");
        jdbcTemplate.execute("DELETE FROM organization_memberships");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM organizations");

        String sA = UUID.randomUUID().toString().substring(0, 8);
        String sB = UUID.randomUUID().toString().substring(0, 8);

        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Milestone Org Alpha " + sA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("m_alpha_" + sA + "@teamden.org")
                .fullName("Alice Miller")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        projectAlpha = projectRepository.save(Project.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .owner(userAlpha)
                .name("Editorial Platform Redesign")
                .description("Next generation publishing engine")
                .status(ProjectStatus.ACTIVE)
                .startDate(LocalDate.now())
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Milestone Org Beta " + sB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("m_beta_" + sB + "@teamden.org")
                .fullName("Bob Beta")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        MvcResult loginResultA = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Secret123!\",\"organizationId\":\"%s\"}",
                                userAlpha.getEmail(), orgAlpha.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) loginResultA.getRequest().getSession(false);

        MvcResult loginResultB = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Secret123!\",\"organizationId\":\"%s\"}",
                                userBeta.getEmail(), orgBeta.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) loginResultB.getRequest().getSession(false);
    }

    @Test
    @DisplayName("GET /api/projects/{projectId}/milestones returns empty list initially")
    void getProjectMilestones_initiallyEmpty() throws Exception {
        mockMvc.perform(get("/api/projects/{projectId}/milestones", projectAlpha.getId())
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/milestones creates milestone and persists to DB")
    void createMilestone_success() throws Exception {
        String payload = """
                {
                    "name": "Design Phase 1",
                    "seqNum": 1,
                    "status": "CURRENT",
                    "statusLabel": "In Progress",
                    "dueDate": "2026-12-01",
                    "description": "Wireframes and high-fidelity mockups"
                }
                """;

        mockMvc.perform(post("/api/projects/{projectId}/milestones", projectAlpha.getId())
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name", is("Design Phase 1")))
                .andExpect(jsonPath("$.seqNum", is(1)))
                .andExpect(jsonPath("$.code", is("01")))
                .andExpect(jsonPath("$.status", is("CURRENT")))
                .andExpect(jsonPath("$.statusLabel", is("In Progress")))
                .andExpect(jsonPath("$.dueDate", is("2026-12-01")));

        List<ProjectMilestone> saved = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(projectAlpha.getId());
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getName()).isEqualTo("Design Phase 1");
        assertThat(saved.get(0).getStatus()).isEqualTo(MilestoneStatus.CURRENT);

        List<ActivityEvent> events = activityEventRepository.findAll();
        assertThat(events).anyMatch(e -> e.getTitle().contains("added milestone"));
    }

    @Test
    @DisplayName("PATCH /api/projects/{projectId}/milestones/{milestoneId} updates milestone and marks completedAt")
    void updateMilestone_statusAndCompletedAt() throws Exception {
        ProjectMilestone m = projectMilestoneRepository.save(ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(projectAlpha)
                .seqNum(1)
                .code("01")
                .name("Discovery")
                .status(MilestoneStatus.CURRENT)
                .statusLabel("In Progress")
                .build());

        String updatePayload = """
                {
                    "name": "Discovery & Research",
                    "status": "COMPLETED"
                }
                """;

        mockMvc.perform(patch("/api/projects/{projectId}/milestones/{milestoneId}", projectAlpha.getId(), m.getId())
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Discovery & Research")))
                .andExpect(jsonPath("$.status", is("COMPLETED")))
                .andExpect(jsonPath("$.statusLabel", is("Completed")))
                .andExpect(jsonPath("$.completedAt").isNotEmpty());

        ProjectMilestone reloaded = projectMilestoneRepository.findById(m.getId()).orElseThrow();
        assertThat(reloaded.getName()).isEqualTo("Discovery & Research");
        assertThat(reloaded.getStatus()).isEqualTo(MilestoneStatus.COMPLETED);
        assertThat(reloaded.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("DELETE /api/projects/{projectId}/milestones/{milestoneId} deletes milestone and disassociates linked tasks")
    void deleteMilestone_success() throws Exception {
        ProjectMilestone m = projectMilestoneRepository.save(ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(projectAlpha)
                .seqNum(1)
                .code("01")
                .name("To Be Deleted")
                .status(MilestoneStatus.UPCOMING)
                .build());

        Task t = taskRepository.save(Task.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(projectAlpha)
                .creator(userAlpha)
                .title("Linked Task")
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .kanbanColumn(KanbanColumn.NOW)
                .milestone(m)
                .build());

        mockMvc.perform(delete("/api/projects/{projectId}/milestones/{milestoneId}", projectAlpha.getId(), m.getId())
                        .session(sessionAlpha)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(projectMilestoneRepository.findById(m.getId())).isEmpty();

        Task taskReloaded = taskRepository.findById(t.getId()).orElseThrow();
        assertThat(taskReloaded.getMilestone()).isNull();
    }

    @Test
    @DisplayName("POST /api/projects/{projectId}/milestones/initialize-template initializes 9 standard lifecycle stages")
    void initializeLifecycleTemplate_seeds9Stages() throws Exception {
        mockMvc.perform(post("/api/projects/{projectId}/milestones/initialize-template", projectAlpha.getId())
                        .session(sessionAlpha)
                        .with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$", hasSize(9)))
                .andExpect(jsonPath("$[0].name", is("Discovery")))
                .andExpect(jsonPath("$[0].status", is("COMPLETED")))
                .andExpect(jsonPath("$[5].name", is("Review")))
                .andExpect(jsonPath("$[5].status", is("CURRENT")))
                .andExpect(jsonPath("$[8].name", is("Post Launch")))
                .andExpect(jsonPath("$[8].status", is("UPCOMING")));

        List<ProjectMilestone> milestones = projectMilestoneRepository.findByProjectIdOrderBySeqNumAsc(projectAlpha.getId());
        assertThat(milestones).hasSize(9);
    }

    @Test
    @DisplayName("Cross-tenant isolation prevents accessing or modifying milestones across organizations")
    void milestoneMultiTenantIsolation() throws Exception {
        ProjectMilestone mAlpha = projectMilestoneRepository.save(ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(projectAlpha)
                .seqNum(1)
                .code("01")
                .name("Alpha Milestone")
                .status(MilestoneStatus.UPCOMING)
                .build());

        // Beta user trying to access Alpha's project milestones
        mockMvc.perform(get("/api/projects/{projectId}/milestones", projectAlpha.getId())
                        .session(sessionBeta))
                .andExpect(status().isNotFound());

        // Beta user trying to update Alpha's milestone
        mockMvc.perform(patch("/api/projects/{projectId}/milestones/{milestoneId}", projectAlpha.getId(), mAlpha.getId())
                        .session(sessionBeta)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Hacked Name\"}"))
                .andExpect(status().isNotFound());

        // Beta user trying to delete Alpha's milestone
        mockMvc.perform(delete("/api/projects/{projectId}/milestones/{milestoneId}", projectAlpha.getId(), mAlpha.getId())
                        .session(sessionBeta)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }
}
