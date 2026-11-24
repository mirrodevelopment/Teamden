package com.shed.teamden.settings;

import com.jayway.jsonpath.JsonPath;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.settings.repository.WorkspaceRolePermissionRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
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
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
public class SettingsIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    @Autowired
    private WorkspaceRolePermissionRepository rolePermissionRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;
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
        jdbcTemplate.execute("DELETE FROM legal_acceptances");
        jdbcTemplate.execute("DELETE FROM user_profiles");
        jdbcTemplate.execute("DELETE FROM organization_addresses");
        jdbcTemplate.execute("DELETE FROM email_verifications");
        jdbcTemplate.execute("DELETE FROM organization_memberships");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM organizations");

        String sA = UUID.randomUUID().toString().substring(0, 8);
        String sB = UUID.randomUUID().toString().substring(0, 8);

        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Acme Co. " + sA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Beta Global " + sB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email("peter_" + sA + "@acme.co")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .fullName("Peter K.")
                .status(UserStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .email("marcus_" + sB + "@betaglobal.com")
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
                        .content("{\"email\":\"" + userAlpha.getEmail() + "\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) authAlpha.getRequest().getSession();

        // Authenticate Beta
        MvcResult authBeta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + userBeta.getEmail() + "\",\"password\":\"Password123!\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) authBeta.getRequest().getSession();
    }

    @Test
    @DisplayName("Fetch settings auto-seeds and returns organization, members, roles, integrations, and security policies")
    void testGetSettingsData_returnsFullSettings() throws Exception {
        mockMvc.perform(get("/api/settings/data")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.name", containsString("Acme Co.")))
                .andExpect(jsonPath("$.organization.type", is("Organisation workspace")))
                .andExpect(jsonPath("$.organization.url", is("acme.brick.app")))
                .andExpect(jsonPath("$.organization.timezone", is("Asia/Kolkata (GMT+5:30)")))
                .andExpect(jsonPath("$.organization.language", is("English")))
                .andExpect(jsonPath("$.organization.weekStartsOn", is("Monday")))
                .andExpect(jsonPath("$.roles", hasSize(4)))
                .andExpect(jsonPath("$.roles[0].name", is("Admin")))
                .andExpect(jsonPath("$.integrations", hasSize(3)))
                .andExpect(jsonPath("$.integrations[0].name", is("Google Calendar")))
                .andExpect(jsonPath("$.integrations[0].connected", is(true)))
                .andExpect(jsonPath("$.integrations[1].name", is("Microsoft 365")))
                .andExpect(jsonPath("$.integrations[2].name", is("Figma")))
                .andExpect(jsonPath("$.securityPolicies", hasSize(4)))
                .andExpect(jsonPath("$.securityPolicies[0].title", is("Access policies")));
    }

    @Test
    @DisplayName("Update organization settings persists new name, type, and preferences")
    void testUpdateOrganization_persistsChanges() throws Exception {
        String updateJson = "{" +
                "\"name\":\"Acme Studio\"," +
                "\"type\":\"Global Studio Workspace\"," +
                "\"url\":\"studio.brick.app\"," +
                "\"logoInitials\":\"AS\"," +
                "\"timezone\":\"UTC (GMT+0:00)\"," +
                "\"language\":\"English\"," +
                "\"weekStartsOn\":\"Sunday\"" +
                "}";

        mockMvc.perform(put("/api/settings/organization")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Acme Studio")))
                .andExpect(jsonPath("$.type", is("Global Studio Workspace")))
                .andExpect(jsonPath("$.url", is("studio.brick.app")))
                .andExpect(jsonPath("$.logoInitials", is("AS")))
                .andExpect(jsonPath("$.timezone", is("UTC (GMT+0:00)")))
                .andExpect(jsonPath("$.weekStartsOn", is("Sunday")));

        // Verify retrieval matches
        mockMvc.perform(get("/api/settings/data")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.name", is("Acme Studio")))
                .andExpect(jsonPath("$.organization.url", is("studio.brick.app")));
    }

    @Test
    @DisplayName("Invite member creates an employee record and returns member DTO")
    void testInviteMember_createsEmployeeRecord() throws Exception {
        String inviteJson = "{" +
                "\"fullName\":\"Elena Rostova\"," +
                "\"email\":\"elena@acme.co\"," +
                "\"department\":\"Design Team\"," +
                "\"role\":\"Member\"" +
                "}";

        mockMvc.perform(post("/api/settings/members/invite")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inviteJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fullName", is("Elena Rostova")))
                .andExpect(jsonPath("$.email", is("elena@acme.co")))
                .andExpect(jsonPath("$.role", is("Member")))
                .andExpect(jsonPath("$.initials", is("ER")));

        // Verify in database
        assertTrue(employeeRepository.findAll().stream()
                .anyMatch(e -> "elena@acme.co".equalsIgnoreCase(e.getEmail())));
    }

    @Test
    @DisplayName("Update member role changes role assignment")
    void testUpdateMemberRole_changesRole() throws Exception {
        // Invite a member first
        String inviteJson = "{" +
                "\"fullName\":\"Samir Khan\"," +
                "\"email\":\"samir@acme.co\"," +
                "\"department\":\"Design Team\"," +
                "\"role\":\"Member\"" +
                "}";

        MvcResult res = mockMvc.perform(post("/api/settings/members/invite")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inviteJson))
                .andExpect(status().isCreated())
                .andReturn();

        String memberId = JsonPath.read(res.getResponse().getContentAsString(), "$.id");

        // Update role to Team Admin
        String updateRoleJson = "{\"role\":\"Team Admin\"}";

        mockMvc.perform(put("/api/settings/members/" + memberId + "/role")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRoleJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("Team Admin")));
    }

    @Test
    @DisplayName("Remove member deletes employee from organization")
    void testRemoveMember_deletesEmployee() throws Exception {
        // Invite member
        String inviteJson = "{" +
                "\"fullName\":\"Lucas Scott\"," +
                "\"email\":\"lucas@acme.co\"," +
                "\"department\":\"Design Team\"," +
                "\"role\":\"Member\"" +
                "}";

        MvcResult res = mockMvc.perform(post("/api/settings/members/invite")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(inviteJson))
                .andExpect(status().isCreated())
                .andReturn();

        String memberId = JsonPath.read(res.getResponse().getContentAsString(), "$.id");

        // Remove member
        mockMvc.perform(delete("/api/settings/members/" + memberId)
                        .session(sessionAlpha))
                .andExpect(status().isNoContent());

        // Verify deleted
        assertFalse(employeeRepository.findById(UUID.fromString(memberId)).isPresent());
    }

    @Test
    @DisplayName("Toggle integration switches connected state")
    void testToggleIntegration_switchesConnectedState() throws Exception {
        // Ensure seeded
        mockMvc.perform(get("/api/settings/data").session(sessionAlpha)).andExpect(status().isOk());

        // Google Calendar starts connected -> toggle to disconnected
        mockMvc.perform(post("/api/settings/integrations/google/toggle")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is("google")))
                .andExpect(jsonPath("$.connected", is(false)))
                .andExpect(jsonPath("$.statusText", is("Available")));

        // Toggle back -> connected
        mockMvc.perform(post("/api/settings/integrations/google/toggle")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected", is(true)))
                .andExpect(jsonPath("$.statusText", is("Connected")));
    }

    @Test
    @DisplayName("Multi-tenant isolation ensures Org Alpha settings are separate from Org Beta")
    void testMultiTenantSettingsIsolation() throws Exception {
        // Seed both
        mockMvc.perform(get("/api/settings/data").session(sessionAlpha)).andExpect(status().isOk());
        mockMvc.perform(get("/api/settings/data").session(sessionBeta)).andExpect(status().isOk());

        // Update Org Alpha
        String reqAlpha = "{\"name\":\"Alpha Exclusive\",\"url\":\"alpha.brick.app\"}";

        mockMvc.perform(put("/api/settings/organization")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqAlpha))
                .andExpect(status().isOk());

        // Check Org Beta is unaffected
        mockMvc.perform(get("/api/settings/data").session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organization.name", not(is("Alpha Exclusive"))))
                .andExpect(jsonPath("$.organization.url", is("acme.brick.app")));
    }

    @Test
    @DisplayName("Role permissions are auto-seeded in relational table and queried properly")
    void testRolePermissions_persistedInDatabaseAndQueried() throws Exception {
        mockMvc.perform(get("/api/settings/data").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.roles", hasSize(4)))
                .andExpect(jsonPath("$.roles[0].id", is("role-admin")))
                .andExpect(jsonPath("$.roles[0].modulePermissions.Settings.view", is(true)))
                .andExpect(jsonPath("$.roles[0].modulePermissions.Settings.create", is(true)))
                .andExpect(jsonPath("$.roles[0].modulePermissions.Settings.edit", is(true)))
                .andExpect(jsonPath("$.roles[0].modulePermissions.Settings.delete", is(true)));

        // Verify in database table
        long count = rolePermissionRepository.countByOrganizationId(orgAlpha.getId());
        assertEquals(16, count, "Should have 16 module permission rows in workspace_role_permissions table");
    }

    @Test
    @DisplayName("Update role permissions updates row in workspace_role_permissions table")
    void testUpdateRolePermissions_updatesDatabaseRow() throws Exception {
        // Seed first
        mockMvc.perform(get("/api/settings/data").session(sessionAlpha)).andExpect(status().isOk());

        String updateRolePermsJson = "{" +
                "\"description\":\"Updated description for members\"," +
                "\"modulePermissions\":{" +
                "\"Settings\":{\"view\":true,\"create\":true,\"edit\":false,\"delete\":false}" +
                "}" +
                "}";

        mockMvc.perform(put("/api/settings/roles/role-member/permissions")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateRolePermsJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("role-member")))
                .andExpect(jsonPath("$.description", is("Updated description for members")))
                .andExpect(jsonPath("$.modulePermissions.Settings.create", is(true)));

        // Verify DB row
        assertTrue(rolePermissionRepository.findByOrganizationIdAndRoleCode(orgAlpha.getId(), "role-member")
                .stream()
                .filter(p -> "Settings".equals(p.getModuleName()))
                .findFirst()
                .map(p -> p.isCanCreate())
                .orElse(false));
    }
}
