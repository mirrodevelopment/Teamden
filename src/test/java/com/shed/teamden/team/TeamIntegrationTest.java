package com.shed.teamden.team;

import com.shed.teamden.employee.entity.Department;
import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.repository.DepartmentRepository;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class TeamIntegrationTest {

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
    private DepartmentRepository departmentRepository;

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
    private Employee empAlphaLead;
    private Employee empAlphaMember;
    private Department deptAlpha;
    private Department deptBeta;
    private Employee empBetaLead;
    private MockHttpSession sessionAlpha;
    private MockHttpSession sessionBeta;

    @BeforeEach
    public void setUp() throws Exception {
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
        jdbcTemplate.execute("DELETE FROM team_permissions");
        jdbcTemplate.execute("DELETE FROM team_lead_assignments");
        jdbcTemplate.execute("DELETE FROM team_members");
        jdbcTemplate.execute("DELETE FROM teams");
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

        // Create Org Alpha
        orgAlpha = organizationRepository.save(Organization.builder()
                .id(UUID.randomUUID())
                .name("Acme Co")
                .status(OrganizationStatus.ACTIVE)
                .build());

        // Create Org Beta
        orgBeta = organizationRepository.save(Organization.builder()
                .id(UUID.randomUUID())
                .name("Beta Global")
                .status(OrganizationStatus.ACTIVE)
                .build());

        // Create User Alpha
        userAlpha = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email("alpha_lead@acme.co")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Alex Lead")
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // Create User Beta
        userBeta = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email("beta_lead@betaglobal.com")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Brenda Beta")
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // Department Alpha
        deptAlpha = departmentRepository.save(Department.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .name("Engineering")
                .subtitle("Core Software & Infrastructure")
                .build());

        // Department Beta
        deptBeta = departmentRepository.save(Department.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .name("Engineering")
                .subtitle("Beta Technology")
                .build());

        // Employees Alpha
        empAlphaLead = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .fullName("Alex Lead")
                .email("alex.lead@acme.co")
                .jobTitle("Engineering Director")
                .department(deptAlpha)
                .departmentName("Engineering")
                .initials("AL")
                .cardTheme("blue")
                .status("ACTIVE")
                .build());

        empAlphaMember = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .fullName("Dev Sarah")
                .email("sarah@acme.co")
                .jobTitle("Senior Engineer")
                .department(deptAlpha)
                .departmentName("Engineering")
                .initials("DS")
                .cardTheme("green")
                .status("ACTIVE")
                .build());

        // Employee Beta
        empBetaLead = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .user(userBeta)
                .fullName("Brenda Beta")
                .email("brenda@betaglobal.com")
                .jobTitle("VP Engineering")
                .department(deptBeta)
                .departmentName("Engineering")
                .initials("BB")
                .cardTheme("lavender")
                .status("ACTIVE")
                .build());

        // Authenticate Sessions
        MvcResult authAlpha = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alpha_lead@acme.co\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) authAlpha.getRequest().getSession();

        MvcResult authBeta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"beta_lead@betaglobal.com\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) authBeta.getRequest().getSession();
    }

    @Test
    @DisplayName("Should retrieve team creation options with departments, employees, and categories")
    void testGetTeamOptions() throws Exception {
        mockMvc.perform(get("/api/teams/options")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departments", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.departments[0].name", is("Engineering")))
                .andExpect(jsonPath("$.employees", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.categories", hasItem("Development")))
                .andExpect(jsonPath("$.visibilityOptions", hasItem("Organization-wide")))
                .andExpect(jsonPath("$.defaultPermissions", hasItem("View Projects")))
                .andExpect(jsonPath("$.memberRoles", hasItem("Team Lead")));
    }

    @Test
    @DisplayName("Should successfully create team with 4 sections, auto-lead membership, and default permissions")
    void testCreateTeamSuccess() throws Exception {
        String payload = """
                {
                  "name": "Mobile Squad",
                  "code": "TEAM-MOBL-01",
                  "description": "Cross-functional team building the iOS & Android apps.",
                  "departmentId": "%s",
                  "category": "Development",
                  "teamLeadId": "%s",
                  "visibility": "Organization-wide",
                  "members": [
                    { "employeeId": "%s", "memberRole": "Core Contributor" }
                  ]
                }
                """.formatted(deptAlpha.getId(), empAlphaLead.getId(), empAlphaMember.getId());

        mockMvc.perform(post("/api/teams")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Mobile Squad")))
                .andExpect(jsonPath("$.code", is("TEAM-MOBL-01")))
                .andExpect(jsonPath("$.teamLeadName", is("Alex Lead")))
                .andExpect(jsonPath("$.memberCount", is(2))) // Team Lead automatically included + 1 member
                .andExpect(jsonPath("$.members[*].fullName", containsInAnyOrder("Alex Lead", "Dev Sarah")))
                .andExpect(jsonPath("$.permissions", hasItem("VIEW_PROJECTS")));

        // Verify retrieval via GET /api/teams
        mockMvc.perform(get("/api/teams")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Mobile Squad")));
    }

    @Test
    @DisplayName("Should enforce mandatory validation on team creation")
    void testCreateTeamValidation() throws Exception {
        // Missing name
        String missingName = """
                {
                  "name": "",
                  "description": "Some description",
                  "departmentId": "%s",
                  "teamLeadId": "%s",
                  "members": [{ "employeeId": "%s" }]
                }
                """.formatted(deptAlpha.getId(), empAlphaLead.getId(), empAlphaMember.getId());

        mockMvc.perform(post("/api/teams")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingName))
                .andExpect(status().isBadRequest());

        // Missing members
        String missingMembers = """
                {
                  "name": "Platform Team",
                  "description": "Core platform",
                  "departmentId": "%s",
                  "teamLeadId": "%s",
                  "members": []
                }
                """.formatted(deptAlpha.getId(), empAlphaLead.getId());

        mockMvc.perform(post("/api/teams")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(missingMembers))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Teams and members should be strictly isolated by organization")
    void testTeamMultiTenantIsolation() throws Exception {
        // Alpha creates "Design Systems Squad"
        String payload = """
                {
                  "name": "Design Systems Squad",
                  "description": "Figma tokens and web components.",
                  "departmentId": "%s",
                  "teamLeadId": "%s",
                  "visibility": "Organization-wide",
                  "members": [
                    { "employeeId": "%s", "memberRole": "Specialist" }
                  ]
                }
                """.formatted(deptAlpha.getId(), empAlphaLead.getId(), empAlphaMember.getId());

        MvcResult createRes = mockMvc.perform(post("/api/teams")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        String teamIdStr = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.id");

        // Beta cannot see Alpha's team in GET /api/teams
        mockMvc.perform(get("/api/teams")
                        .session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", not(hasItem("Design Systems Squad"))));

        // Beta cannot retrieve Alpha's team by ID
        mockMvc.perform(get("/api/teams/" + teamIdStr)
                        .session(sessionBeta))
                .andExpect(status().isNotFound());

        // Beta can create a team with the exact same name without conflict
        String betaPayload = """
                {
                  "name": "Design Systems Squad",
                  "description": "Beta's brand guidelines.",
                  "departmentId": "%s",
                  "teamLeadId": "%s",
                  "visibility": "Organization-wide",
                  "members": [
                    { "employeeId": "%s", "memberRole": "Lead" }
                  ]
                }
                """.formatted(deptBeta.getId(), empBetaLead.getId(), empBetaLead.getId());

        mockMvc.perform(post("/api/teams")
                        .session(sessionBeta)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(betaPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Design Systems Squad")));
    }
}
