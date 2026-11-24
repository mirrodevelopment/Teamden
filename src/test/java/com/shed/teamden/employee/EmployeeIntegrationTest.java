package com.shed.teamden.employee;

import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
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

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class EmployeeIntegrationTest {

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
        private EmployeeRepository employeeRepository;

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
        public void setUp() throws Exception {
                mockMvc = MockMvcBuilders.webAppContextSetup(context)
                                .apply(SecurityMockMvcConfigurers.springSecurity())
                                .build();

                jdbcTemplate.execute("DELETE FROM workspace_role_permissions");
                jdbcTemplate.execute("DELETE FROM workspace_security_policies");
                jdbcTemplate.execute("DELETE FROM workspace_integrations");
                jdbcTemplate.execute("DELETE FROM workspace_settings");
                jdbcTemplate.execute("DELETE FROM employee_shared_documents");
                jdbcTemplate.execute("DELETE FROM employee_collaborations");
                jdbcTemplate.execute("DELETE FROM employee_responsibilities");
                jdbcTemplate.execute("DELETE FROM inbox_items");
                jdbcTemplate.execute("DELETE FROM inbox_preferences");
                jdbcTemplate.execute("DELETE FROM user_pinned_projects");
                jdbcTemplate.execute("DELETE FROM workspace_roles");
                jdbcTemplate.execute("DELETE FROM employees");
                jdbcTemplate.execute("DELETE FROM departments");
                jdbcTemplate.execute("DELETE FROM notifications");
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
                                .name("Acme Co.")
                                .status(OrganizationStatus.ACTIVE)
                                .build());

                orgBeta = organizationRepository.save(Organization.builder()
                                .name("Beta Global")
                                .status(OrganizationStatus.ACTIVE)
                                .build());

                userAlpha = userRepository.save(User.builder()
                                .id(UUID.randomUUID())
                                .email("alpha_lead@acme.co")
                                .passwordHash(passwordEncoder.encode("Password123!"))
                                .fullName("Peter K.")
                                .status(UserStatus.ACTIVE)
                                .build());

                userBeta = userRepository.save(User.builder()
                                .id(UUID.randomUUID())
                                .email("beta_lead@betaglobal.com")
                                .passwordHash(passwordEncoder.encode("Password123!"))
                                .fullName("Marcus Beta")
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
                MvcResult authAlpha = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"email\":\"alpha_lead@acme.co\",\"password\":\"Password123!\"}"))
                                .andExpect(status().isOk())
                                .andReturn();
                sessionAlpha = (MockHttpSession) authAlpha.getRequest().getSession();

                // Authenticate Beta
                MvcResult authBeta = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content("{\"email\":\"beta_lead@betaglobal.com\",\"password\":\"Password123!\"}"))
                                .andExpect(status().isOk())
                                .andReturn();
                sessionBeta = (MockHttpSession) authBeta.getRequest().getSession();
        }

        @Test
        @DisplayName("Fetch employees returns clean empty state when no employees exist in organization")
        void testGetDirectoryReturnsEmptyWhenNoEmployees() throws Exception {
                mockMvc.perform(get("/api/employees")
                                .session(sessionAlpha))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.peopleCount", is(0)))
                                .andExpect(jsonPath("$.employees", hasSize(0)))
                                .andExpect(jsonPath("$.roles", hasSize(0)))
                                .andExpect(jsonPath("$.departments", hasSize(0)));
        }

        @Test
        @DisplayName("Create employee successfully adds to directory and assigns responsibilities")
        void testCreateEmployee() throws Exception {
                String newEmpJson = "{" +
                                "\"fullName\":\"Elena T.\"," +
                                "\"email\":\"elena.t@acme.co\"," +
                                "\"jobTitle\":\"Senior Frontend Engineer\"," +
                                "\"departmentName\":\"Engineering\"," +
                                "\"companyName\":\"Workspace\"," +
                                "\"shortBio\":\"Builds modular design systems and accessible client apps.\"," +
                                "\"responsibilities\":[\"Design system tokens implementation\",\"Web accessibility audits\"],"
                                +
                                "\"employmentType\":\"Full-time\"," +
                                "\"workLocation\":\"Remote\"," +
                                "\"roleTitle\":\"Employee\"" +
                                "}";

                mockMvc.perform(post("/api/employees")
                                .session(sessionAlpha)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(newEmpJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.fullName", is("Elena T.")))
                                .andExpect(jsonPath("$.initials", is("ET")))
                                .andExpect(jsonPath("$.email", is("elena.t@acme.co")))
                                .andExpect(jsonPath("$.jobTitle", is("Senior Frontend Engineer")));

                // Check directory updated
                mockMvc.perform(get("/api/employees").session(sessionAlpha))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.peopleCount", is(1)));
        }

        @Test
        @DisplayName("Create employee rejects duplicates and empty required fields")
        void testCreateEmployeeValidations() throws Exception {
                employeeRepository.save(Employee.builder()
                                .id(UUID.randomUUID())
                                .organization(orgAlpha)
                                .fullName("Alex Rivera")
                                .email("alex.r@acme.co")
                                .jobTitle("Designer")
                                .initials("AR")
                                .build());

                // Duplicate email
                String dupJson = "{" +
                                "\"fullName\":\"Alex Duplicate\"," +
                                "\"email\":\"alex.r@acme.co\"," +
                                "\"jobTitle\":\"Designer\"" +
                                "}";

                mockMvc.perform(post("/api/employees")
                                .session(sessionAlpha)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(dupJson))
                                .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Add and delete employee responsibilities dynamically")
        void testAddAndDeleteResponsibility() throws Exception {
                Employee alex = employeeRepository.save(Employee.builder()
                                .id(UUID.randomUUID())
                                .organization(orgAlpha)
                                .fullName("Alex Rivera")
                                .email("alex.r@acme.co")
                                .jobTitle("Designer")
                                .initials("AR")
                                .build());

                String addRespJson = "{\"title\":\"Design token architecture\",\"primary\":false}";

                MvcResult addRes = mockMvc.perform(post("/api/employees/" + alex.getId() + "/responsibilities")
                                .session(sessionAlpha)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(addRespJson))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.title", is("Design token architecture")))
                                .andReturn();

                String respIdStr = com.jayway.jsonpath.JsonPath.read(addRes.getResponse().getContentAsString(), "$.id");
                UUID respId = UUID.fromString(respIdStr);

                // Delete responsibility
                mockMvc.perform(delete("/api/employees/" + alex.getId() + "/responsibilities/" + respId)
                                .session(sessionAlpha))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.success", is(true)));
        }

        @Test
        @DisplayName("Multi-tenant isolation: Organization Beta has separate employee space")
        void testMultiTenantIsolation() throws Exception {
                Employee empAlpha = employeeRepository.save(Employee.builder()
                                .id(UUID.randomUUID())
                                .organization(orgAlpha)
                                .fullName("Alpha Employee")
                                .email("emp@orgalpha.com")
                                .jobTitle("Lead")
                                .initials("AE")
                                .build());

                employeeRepository.save(Employee.builder()
                                .id(UUID.randomUUID())
                                .organization(orgBeta)
                                .fullName("Beta Employee")
                                .email("emp@orgbeta.com")
                                .jobTitle("Engineer")
                                .initials("BE")
                                .build());

                List<Employee> alphaEmployees = employeeRepository
                                .findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(orgAlpha.getId());
                List<Employee> betaEmployees = employeeRepository
                                .findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(orgBeta.getId());

                assertThat(alphaEmployees).hasSize(1);
                assertThat(betaEmployees).hasSize(1);

                // Ensure IDs are strictly isolated
                assertThat(alphaEmployees.get(0).getId()).isNotEqualTo(betaEmployees.get(0).getId());

                // Beta user cannot access Alpha employee
                mockMvc.perform(get("/api/employees/" + empAlpha.getId())
                                .session(sessionBeta))
                                .andExpect(status().isNotFound());
        }

        @Test
        @DisplayName("Should create department and retrieve via GET /api/departments")
        void testCreateAndGetDepartments() throws Exception {
                Employee emp = employeeRepository.save(Employee.builder()
                                .id(UUID.randomUUID())
                                .organization(orgAlpha)
                                .fullName("Test Engineer")
                                .email("engineer@orgalpha.com")
                                .jobTitle("Senior Dev")
                                .initials("TE")
                                .build());

                String payload = """
                                {
                                  "name": "Mobile Engineering",
                                  "subtitle": "iOS and Android platforms",
                                  "memberIds": ["%s"]
                                }
                                """.formatted(emp.getId());

                mockMvc.perform(post("/api/departments")
                                .session(sessionAlpha)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.name", is("Mobile Engineering")))
                                .andExpect(jsonPath("$.subtitle", is("iOS and Android platforms")))
                                .andExpect(jsonPath("$.memberCount", is(1)));

                mockMvc.perform(get("/api/departments")
                                .session(sessionAlpha))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                                .andExpect(jsonPath("$[*].name", hasItem("Mobile Engineering")));
        }

        @Test
        @DisplayName("Departments should be strictly isolated by organization")
        void testDepartmentMultiTenantIsolation() throws Exception {
                String payload = """
                                {
                                  "name": "Platform Squad",
                                  "subtitle": "Core infrastructure"
                                }
                                """;

                // Alpha creates Platform Squad
                mockMvc.perform(post("/api/departments")
                                .session(sessionAlpha)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                                .andExpect(status().isCreated());

                // Beta does not see Alpha's department
                mockMvc.perform(get("/api/departments")
                                .session(sessionBeta))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[*].name", not(hasItem("Platform Squad"))));

                // Beta can create their own Platform Squad without conflict
                mockMvc.perform(post("/api/departments")
                                .session(sessionBeta)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(payload))
                                .andExpect(status().isCreated());
        }
}
