package com.shed.teamden.overview;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.DecisionStatus;
import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectDecision;
import com.shed.teamden.project.entity.ProjectMilestone;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectDecisionRepository;
import com.shed.teamden.project.repository.ProjectMilestoneRepository;
import com.shed.teamden.project.repository.ProjectRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class OverviewIntegrationTest {

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
    private ProjectDecisionRepository projectDecisionRepository;

    @Autowired
    private ProjectMilestoneRepository projectMilestoneRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Organization orgAlpha;
    private User userAlpha;
    private MockHttpSession sessionAlpha;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        jdbcTemplate.execute("DELETE FROM task_linked_documents");
        jdbcTemplate.execute("DELETE FROM inbox_items");
        jdbcTemplate.execute("DELETE FROM inbox_preferences");
        jdbcTemplate.execute("DELETE FROM user_pinned_projects");
        jdbcTemplate.execute("DELETE FROM employee_shared_documents");
        jdbcTemplate.execute("DELETE FROM employee_collaborations");
        jdbcTemplate.execute("DELETE FROM employee_responsibilities");
        jdbcTemplate.execute("DELETE FROM workspace_role_permissions");
        jdbcTemplate.execute("DELETE FROM workspace_security_policies");
        jdbcTemplate.execute("DELETE FROM workspace_integrations");
        jdbcTemplate.execute("DELETE FROM workspace_settings");
        jdbcTemplate.execute("DELETE FROM workspace_roles");
        jdbcTemplate.execute("DELETE FROM employees");
        jdbcTemplate.execute("DELETE FROM departments");
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
        jdbcTemplate.execute("DELETE FROM daily_updates");
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM organizations");

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Alpha Studio " + suffix)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("alpha_" + suffix + "@overviewtest.org")
                .fullName("Alex Rivera")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .build());

        MvcResult login = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Password123!\",\"organizationId\":\"%s\"}",
                                userAlpha.getEmail(), orgAlpha.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) login.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Fetch overview data returns empty state when 0 projects or decisions exist")
    void testFetchOverviewDataReturnsEmptyState() throws Exception {
        mockMvc.perform(get("/api/overview/data").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.activeProjects", is(0)))
                .andExpect(jsonPath("$.kpis.pendingDecisions", is(0)))
                .andExpect(jsonPath("$.kpis.blockedHandoffs", is(0)))
                .andExpect(jsonPath("$.kpis.upcomingMilestones", is(0)))
                .andExpect(jsonPath("$.projects", hasSize(0)))
                .andExpect(jsonPath("$.decisions", hasSize(0)))
                .andExpect(jsonPath("$.dependencies", hasSize(0)));
    }

    @Test
    @DisplayName("Fetch overview data reflects live database projects, decisions, and blocked tasks")
    void testFetchOverviewDataReflectsLiveDb() throws Exception {
        Project proj = projectRepository.save(Project.builder()
                .organization(orgAlpha)
                .name("Core Platform Redesign")
                .description("Redesign the core platform architecture")
                .status(ProjectStatus.ACTIVE)
                .owner(userAlpha)
                .dueDate(LocalDate.now().plusDays(14))
                .build());

        projectDecisionRepository.save(ProjectDecision.builder()
                .organization(orgAlpha)
                .project(proj)
                .title("Approve API Spec")
                .status(DecisionStatus.PENDING)
                .dueDate(LocalDate.now().plusDays(3))
                .build());

        taskRepository.save(Task.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(proj)
                .creator(userAlpha)
                .taskCode("T-101")
                .title("Authentication Token Refresh")
                .description("Blocked by auth endpoint migration")
                .status(TaskStatus.BLOCKED)
                .priority(TaskPriority.HIGH)
                .build());

        projectMilestoneRepository.save(ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(proj)
                .code("M1")
                .name("Beta Launch")
                .status(MilestoneStatus.CURRENT)
                .dueDate(LocalDate.now().plusDays(7))
                .seqNum(1)
                .build());

        mockMvc.perform(get("/api/overview/data").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.kpis.activeProjects", is(1)))
                .andExpect(jsonPath("$.kpis.pendingDecisions", is(1)))
                .andExpect(jsonPath("$.kpis.blockedHandoffs", is(1)))
                .andExpect(jsonPath("$.kpis.upcomingMilestones", is(1)))
                .andExpect(jsonPath("$.projects", hasSize(1)))
                .andExpect(jsonPath("$.projects[0].name", is("Core Platform Redesign")))
                .andExpect(jsonPath("$.decisions", hasSize(1)))
                .andExpect(jsonPath("$.decisions[0].title", is("Approve API Spec")))
                .andExpect(jsonPath("$.dependencies", hasSize(1)))
                .andExpect(jsonPath("$.dependencies[0].title", is("Authentication Token Refresh")));
    }

    @Test
    @DisplayName("Fetch insights data aggregates live metrics from database")
    void testFetchInsightsDataAggregatesDbMetrics() throws Exception {
        mockMvc.perform(get("/api/insights/data").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metrics.milestones.periods.30.completedCount", containsString("0 of 0 milestones")))
                .andExpect(jsonPath("$.lateMilestones", hasSize(0)));
    }
}
