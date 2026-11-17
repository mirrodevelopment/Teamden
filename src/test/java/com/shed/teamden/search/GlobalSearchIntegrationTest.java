package com.shed.teamden.search;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class GlobalSearchIntegrationTest {

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
    private TaskRepository taskRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Organization orgAlpha;
    private Organization orgBeta;
    private User userAlpha;
    private User userBeta;
    private MockHttpSession sessionAlpha;
    private MockHttpSession sessionBeta;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        jdbcTemplate.execute("DELETE FROM daily_updates");
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

        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Alpha Corp")
                .status(OrganizationStatus.ACTIVE)
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Beta Corp")
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email("alpha@teamden.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Alex Alpha")
                .status(UserStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email("beta@teamden.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Bob Beta")
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // Authenticate Alpha
        MvcResult authResultAlpha = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alpha@teamden.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) authResultAlpha.getRequest().getSession();

        // Authenticate Beta
        MvcResult authResultBeta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"beta@teamden.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) authResultBeta.getRequest().getSession();
    }

    @Test
    @DisplayName("Global search finds tasks and projects by query with tenant isolation")
    void testGlobalSearchAcrossEntitiesWithTenantIsolation() throws Exception {
        // Create Alpha project and task
        Project projAlpha = projectRepository.save(Project.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .name("Mobile Navigation Redesign")
                .description("Revamp mobile navigation")
                .status(ProjectStatus.ACTIVE)
                .owner(userAlpha)
                .build());

        taskRepository.save(Task.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(projAlpha)
                .title("Refine mobile navigation")
                .taskCode("T-014")
                .creator(userAlpha)
                .assignee(userAlpha)
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.HIGH)
                .build());

        // Create Beta project with similar name
        projectRepository.save(Project.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .name("Mobile Navigation Beta Secret")
                .status(ProjectStatus.ACTIVE)
                .owner(userBeta)
                .build());

        // Alpha searches for "mobile"
        mockMvc.perform(get("/api/search")
                        .session(sessionAlpha)
                        .param("q", "mobile")
                        .param("category", "ALL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results", hasSize(2)))
                .andExpect(jsonPath("$.counts.TASKS", is(1)))
                .andExpect(jsonPath("$.counts.PROJECTS", is(1)))
                .andExpect(jsonPath("$.results[?(@.title == 'Refine mobile navigation')].taskCode", contains("T-014")))
                .andExpect(jsonPath("$.results[?(@.title == 'Mobile Navigation Beta Secret')]", empty()));
    }

    @Test
    @DisplayName("Category filtering restricts results to selected category")
    void testCategoryFiltering() throws Exception {
        Project proj = projectRepository.save(Project.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .name("Core Architecture")
                .status(ProjectStatus.ACTIVE)
                .owner(userAlpha)
                .build());

        taskRepository.save(Task.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .project(proj)
                .title("Refactor Core Architecture")
                .taskCode("T-100")
                .creator(userAlpha)
                .assignee(userAlpha)
                .status(TaskStatus.TODO)
                .priority(TaskPriority.MEDIUM)
                .build());

        // Filter category=PROJECTS
        mockMvc.perform(get("/api/search")
                        .session(sessionAlpha)
                        .param("q", "core")
                        .param("category", "PROJECTS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results", hasSize(1)))
                .andExpect(jsonPath("$.results[0].type", is("PROJECT")))
                .andExpect(jsonPath("$.results[0].title", is("Core Architecture")));

        // Filter category=TASKS
        mockMvc.perform(get("/api/search")
                        .session(sessionAlpha)
                        .param("q", "core")
                        .param("category", "TASKS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results", hasSize(1)))
                .andExpect(jsonPath("$.results[0].type", is("TASK")))
                .andExpect(jsonPath("$.results[0].title", is("Refactor Core Architecture")));
    }
}
