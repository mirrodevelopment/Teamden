package com.shed.teamden.project;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class UserPinnedProjectsIntegrationTest {

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
        private PasswordEncoder passwordEncoder;

        @Autowired
        private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

        private Organization orgAlpha;
        private Organization orgBeta;

        private User userAlpha1;
        private User userAlpha2;
        private User userBeta;

        private Project ongoingProjectAlpha1;
        private Project ongoingProjectAlpha2;
        private Project completedProjectAlpha;
        private Project ongoingProjectBeta;

        private MockHttpSession sessionAlpha1;
        private MockHttpSession sessionAlpha2;

        @BeforeEach
        void setUp() throws Exception {
                mockMvc = MockMvcBuilders.webAppContextSetup(context)
                                .apply(SecurityMockMvcConfigurers.springSecurity())
                                .build();

                jdbcTemplate.execute("DELETE FROM inbox_items");
                jdbcTemplate.execute("DELETE FROM inbox_preferences");
                jdbcTemplate.execute("DELETE FROM user_pinned_projects");
                jdbcTemplate.execute("DELETE FROM workspace_role_permissions");
                jdbcTemplate.execute("DELETE FROM workspace_security_policies");
                jdbcTemplate.execute("DELETE FROM workspace_integrations");
                jdbcTemplate.execute("DELETE FROM workspace_settings");
                jdbcTemplate.execute("DELETE FROM employee_shared_documents");
                jdbcTemplate.execute("DELETE FROM employee_collaborations");
                jdbcTemplate.execute("DELETE FROM employee_responsibilities");
                jdbcTemplate.execute("DELETE FROM workspace_roles");
                jdbcTemplate.execute("DELETE FROM employees");
                jdbcTemplate.execute("DELETE FROM departments");
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
                jdbcTemplate.execute("DELETE FROM daily_updates");
                jdbcTemplate.execute("DELETE FROM notifications");
                jdbcTemplate.execute("DELETE FROM users");
                jdbcTemplate.execute("DELETE FROM organizations");

                String sfx = UUID.randomUUID().toString().substring(0, 8);

                orgAlpha = organizationRepository.save(Organization.builder()
                                .name("Acme Co " + sfx)
                                .status(OrganizationStatus.ACTIVE)
                                .build());

                orgBeta = organizationRepository.save(Organization.builder()
                                .name("Beta Corp " + sfx)
                                .status(OrganizationStatus.ACTIVE)
                                .build());

                userAlpha1 = userRepository.save(User.builder()
                                .email("peter_" + sfx + "@acme.org")
                                .fullName("Peter K.")
                                .passwordHash(passwordEncoder.encode("Password123!"))
                                .status(UserStatus.ACTIVE)
                                .build());

                userAlpha2 = userRepository.save(User.builder()
                                .email("alex_" + sfx + "@acme.org")
                                .fullName("Alex R.")
                                .passwordHash(passwordEncoder.encode("Password123!"))
                                .status(UserStatus.ACTIVE)
                                .build());

                userBeta = userRepository.save(User.builder()
                                .email("beta_" + sfx + "@beta.org")
                                .fullName("Beta User")
                                .passwordHash(passwordEncoder.encode("Password123!"))
                                .status(UserStatus.ACTIVE)
                                .build());

                membershipRepository.save(OrganizationMembership.builder()
                                .organization(orgAlpha)
                                .user(userAlpha1)
                                .role(MembershipRole.ADMIN)
                                .status(MembershipStatus.ACTIVE)
                                .build());

                membershipRepository.save(OrganizationMembership.builder()
                                .organization(orgAlpha)
                                .user(userAlpha2)
                                .role(MembershipRole.MEMBER)
                                .status(MembershipStatus.ACTIVE)
                                .build());

                membershipRepository.save(OrganizationMembership.builder()
                                .organization(orgBeta)
                                .user(userBeta)
                                .role(MembershipRole.ADMIN)
                                .status(MembershipStatus.ACTIVE)
                                .build());

                ongoingProjectAlpha1 = projectRepository.save(Project.builder()
                                .organization(orgAlpha)
                                .name("Website Redesign")
                                .description("Modern marketing site")
                                .status(ProjectStatus.ACTIVE)
                                .owner(userAlpha1)
                                .startDate(LocalDate.now().minusDays(5))
                                .dueDate(LocalDate.now().plusDays(20))
                                .build());

                ongoingProjectAlpha2 = projectRepository.save(Project.builder()
                                .organization(orgAlpha)
                                .name("Client Application")
                                .description("Client dashboard build")
                                .status(ProjectStatus.PLANNING)
                                .owner(userAlpha2)
                                .startDate(LocalDate.now())
                                .dueDate(LocalDate.now().plusDays(30))
                                .build());

                completedProjectAlpha = projectRepository.save(Project.builder()
                                .organization(orgAlpha)
                                .name("Old Legacy System")
                                .description("Finished old system")
                                .status(ProjectStatus.COMPLETED)
                                .owner(userAlpha1)
                                .build());

                ongoingProjectBeta = projectRepository.save(Project.builder()
                                .organization(orgBeta)
                                .name("Beta Project X")
                                .description("Beta org secret project")
                                .status(ProjectStatus.ACTIVE)
                                .owner(userBeta)
                                .build());

                sessionAlpha1 = authenticate(userAlpha1.getEmail(), "Password123!");
                sessionAlpha2 = authenticate(userAlpha2.getEmail(), "Password123!");
        }

        private MockHttpSession authenticate(String email, String password) throws Exception {
                String payload = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
                MvcResult result = mockMvc.perform(post("/api/auth/login")
                                .with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                                .andExpect(status().isOk())
                                .andReturn();
                return (MockHttpSession) result.getRequest().getSession(false);
        }

        @Test
        @DisplayName("Initially, user has no pinned projects")
        void testInitiallyEmptyPinnedProjects() throws Exception {
                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("User Alpha pins ongoing project; subsequent fetch returns it")
        void testPinOngoingProjectSuccessfully() throws Exception {
                mockMvc.perform(post("/api/projects/" + ongoingProjectAlpha1.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id", is(ongoingProjectAlpha1.getId().toString())))
                                .andExpect(jsonPath("$.name", is("Website Redesign")))
                                .andExpect(jsonPath("$.status", is("ACTIVE")));

                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].name", is("Website Redesign")));
        }

        @Test
        @DisplayName("User isolation: Pinned projects are strictly scoped to the authenticated user")
        void testUserIsolationForPinnedProjects() throws Exception {
                // User Alpha 1 pins Website Redesign
                mockMvc.perform(post("/api/projects/" + ongoingProjectAlpha1.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isOk());

                // User Alpha 1 sees 1 pinned project
                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].id", is(ongoingProjectAlpha1.getId().toString())));

                // User Alpha 2 in the SAME organization sees 0 pinned projects (User scoped!)
                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha2))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(0)));

                // User Alpha 2 pins Client Application
                mockMvc.perform(post("/api/projects/" + ongoingProjectAlpha2.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha2))
                                .andExpect(status().isOk());

                // User Alpha 2 now sees only Client Application
                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha2))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].id", is(ongoingProjectAlpha2.getId().toString())));

                // User Alpha 1 still only sees Website Redesign
                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(1)))
                                .andExpect(jsonPath("$[0].id", is(ongoingProjectAlpha1.getId().toString())));
        }

        @Test
        @DisplayName("User can unpin project and list reflects removal")
        void testUnpinProject() throws Exception {
                mockMvc.perform(post("/api/projects/" + ongoingProjectAlpha1.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isOk());

                mockMvc.perform(delete("/api/projects/" + ongoingProjectAlpha1.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isNoContent());

                mockMvc.perform(get("/api/projects/pinned").session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(0)));
        }

        @Test
        @DisplayName("Cannot pin completed project")
        void testCannotPinCompletedProject() throws Exception {
                mockMvc.perform(post("/api/projects/" + completedProjectAlpha.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Multi-org security: User cannot pin project from another organization")
        void testCannotPinProjectFromAnotherOrg() throws Exception {
                mockMvc.perform(post("/api/projects/" + ongoingProjectBeta.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Ongoing available endpoint returns ongoing projects with isPinned flag")
        void testOngoingAvailableProjects() throws Exception {
                mockMvc.perform(post("/api/projects/" + ongoingProjectAlpha1.getId() + "/pin")
                                .with(csrf())
                                .session(sessionAlpha1))
                                .andExpect(status().isOk());

                mockMvc.perform(get("/api/projects/ongoing-available").session(sessionAlpha1))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(2))) // Website Redesign & Client Application,
                                                                      // excluding Completed
                                .andExpect(jsonPath("$[?(@.id == '" + ongoingProjectAlpha1.getId() + "')].isPinned")
                                                .value(contains(true)))
                                .andExpect(jsonPath("$[?(@.id == '" + ongoingProjectAlpha2.getId() + "')].isPinned")
                                                .value(contains(false)));
        }
}
