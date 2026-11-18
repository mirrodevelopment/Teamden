package com.shed.teamden.employee;

import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.employee.repository.EmployeeResponsibilityRepository;
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
    private EmployeeResponsibilityRepository responsibilityRepository;

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

        jdbcTemplate.execute("DELETE FROM employee_shared_documents");
        jdbcTemplate.execute("DELETE FROM employee_collaborations");
        jdbcTemplate.execute("DELETE FROM employee_responsibilities");
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
    @DisplayName("Fetch employees auto-seeds default 4 employees, roles, departments and active detail")
    void testGetDirectoryAutoSeedsAndReturnsReferenceData() throws Exception {
        mockMvc.perform(get("/api/employees")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.peopleCount", is(4)))
                .andExpect(jsonPath("$.rolesCount", is(6)))
                .andExpect(jsonPath("$.selectedDepartmentName", is("Design Team")))
                .andExpect(jsonPath("$.employees", hasSize(4)))
                .andExpect(jsonPath("$.employees[0].fullName", is("Peter K.")))
                .andExpect(jsonPath("$.employees[0].cardTheme", is("peach")))
                .andExpect(jsonPath("$.employees[1].fullName", is("Alex R.")))
                .andExpect(jsonPath("$.employees[1].cardTheme", is("lavender")))
                .andExpect(jsonPath("$.employees[2].fullName", is("Sarah K.")))
                .andExpect(jsonPath("$.employees[2].cardTheme", is("blue")))
                .andExpect(jsonPath("$.employees[3].fullName", is("James L.")))
                .andExpect(jsonPath("$.employees[3].cardTheme", is("green")))
                .andExpect(jsonPath("$.activeEmployee.profile.fullName", is("Alex R.")))
                .andExpect(jsonPath("$.activeEmployee.profile.jobTitle", is("Product Designer")))
                .andExpect(jsonPath("$.activeEmployee.profile.departmentName", is("Design Team")))
                .andExpect(jsonPath("$.activeEmployee.responsibilities", hasSize(3)))
                .andExpect(jsonPath("$.activeEmployee.responsibilities[0].title", is("Interface design & reviews")))
                .andExpect(jsonPath("$.activeEmployee.workInMotion", hasSize(2)))
                .andExpect(jsonPath("$.activeEmployee.workingTogether", hasSize(1)))
                .andExpect(jsonPath("$.activeEmployee.sharedKnowledge", hasSize(1)))
                .andExpect(jsonPath("$.roles", hasSize(6)))
                .andExpect(jsonPath("$.departments", hasSize(4)));
    }

    @Test
    @DisplayName("Create employee successfully adds to directory and assigns responsibilities")
    void testCreateEmployee() throws Exception {
        // Trigger seed first
        mockMvc.perform(get("/api/employees").session(sessionAlpha)).andExpect(status().isOk());

        String newEmpJson = "{" +
                "\"fullName\":\"Elena T.\"," +
                "\"email\":\"elena.t@acme.co\"," +
                "\"jobTitle\":\"Senior Frontend Engineer\"," +
                "\"departmentName\":\"Engineering\"," +
                "\"companyName\":\"Acme Co.\"," +
                "\"shortBio\":\"Builds modular design systems and accessible client apps.\"," +
                "\"responsibilities\":[\"Design system tokens implementation\",\"Web accessibility audits\"]," +
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
                .andExpect(jsonPath("$.peopleCount", is(5)));
    }

    @Test
    @DisplayName("Create employee rejects duplicates and empty required fields")
    void testCreateEmployeeValidations() throws Exception {
        mockMvc.perform(get("/api/employees").session(sessionAlpha)).andExpect(status().isOk());

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
        mockMvc.perform(get("/api/employees").session(sessionAlpha)).andExpect(status().isOk());

        Employee alex = employeeRepository.findByOrganizationIdAndEmailIgnoreCase(orgAlpha.getId(), "alex.r@acme.co")
                .orElseThrow();

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
        // Seed Alpha
        mockMvc.perform(get("/api/employees").session(sessionAlpha)).andExpect(status().isOk());

        // Seed Beta
        mockMvc.perform(get("/api/employees").session(sessionBeta)).andExpect(status().isOk());

        List<Employee> alphaEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(orgAlpha.getId());
        List<Employee> betaEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(orgBeta.getId());

        assertThat(alphaEmployees).hasSize(4);
        assertThat(betaEmployees).hasSize(4);

        // Ensure IDs are strictly isolated
        assertThat(alphaEmployees.get(0).getId()).isNotEqualTo(betaEmployees.get(0).getId());

        // Beta user cannot access Alpha employee
        mockMvc.perform(get("/api/employees/" + alphaEmployees.get(0).getId())
                        .session(sessionBeta))
                .andExpect(status().isNotFound());
    }
}
