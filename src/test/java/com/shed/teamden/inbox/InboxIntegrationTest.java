package com.shed.teamden.inbox;

import com.jayway.jsonpath.JsonPath;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class InboxIntegrationTest {

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

        // Org Alpha
        orgAlpha = organizationRepository.save(Organization.builder()
                .id(UUID.randomUUID())
                .name("Alpha Studio")
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .fullName("Alex Alpha")
                .email("alpha@inbox.org")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // Org Beta
        orgBeta = organizationRepository.save(Organization.builder()
                .id(UUID.randomUUID())
                .name("Beta Collective")
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .fullName("Boris Beta")
                .email("beta@inbox.org")
                .passwordHash(passwordEncoder.encode("Password123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        sessionAlpha = loginAndGetSession("alpha@inbox.org", "Password123!", orgAlpha.getId());
        sessionBeta = loginAndGetSession("beta@inbox.org", "Password123!", orgBeta.getId());
    }

    private MockHttpSession loginAndGetSession(String email, String password, UUID orgId) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"%s\",\"organizationId\":\"%s\"}", email, password, orgId)))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) res.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Zero Seed Data Guarantee: Empty inbox table returns strictly 0 counts and empty arrays")
    void testEmptyTableReturnsZeroCounts() throws Exception {
        mockMvc.perform(get("/api/inbox")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(0)))
                .andExpect(jsonPath("$.counts.unread", is(0)))
                .andExpect(jsonPath("$.counts.needsAction", is(0)))
                .andExpect(jsonPath("$.counts.updates", is(0)))
                .andExpect(jsonPath("$.counts.archived", is(0)))
                .andExpect(jsonPath("$.counts.mentions", is(0)))
                .andExpect(jsonPath("$.counts.following", is(0)))
                .andExpect(jsonPath("$.attentionQueue", hasSize(0)))
                .andExpect(jsonPath("$.updatesToday", hasSize(0)))
                .andExpect(jsonPath("$.updatesEarlier", hasSize(0)))
                .andExpect(jsonPath("$.activeItem").doesNotExist());
    }

    @Test
    @DisplayName("Dynamic Item Creation: POST /api/inbox creates relational item in PostgreSQL")
    void testCreateInboxItemViaApi() throws Exception {
        String payload = """
                {
                    "title": "Design review required",
                    "subtitle": "Sprint 45 · Action requested",
                    "description": "Please review mobile transitions before deployment.",
                    "category": "NEEDS_ACTION",
                    "section": "ATTENTION_QUEUE",
                    "filterType": "ALL",
                    "itemType": "APPROVAL",
                    "projectTitle": "Mobile Redesign",
                    "requesterName": "Elena T.",
                    "requesterInitials": "ET",
                    "dueDateStr": "Due Tomorrow",
                    "actionLabel": "Review"
                }
                """;

        MvcResult result = mockMvc.perform(post("/api/inbox")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title", is("Design review required")))
                .andExpect(jsonPath("$.category", is("NEEDS_ACTION")))
                .andExpect(jsonPath("$.section", is("ATTENTION_QUEUE")))
                .andExpect(jsonPath("$.isRead", is(false)))
                .andReturn();

        String createdId = JsonPath.read(result.getResponse().getContentAsString(), "$.id");

        // Verify count updated in DB
        mockMvc.perform(get("/api/inbox")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(1)))
                .andExpect(jsonPath("$.counts.unread", is(1)))
                .andExpect(jsonPath("$.counts.needsAction", is(1)))
                .andExpect(jsonPath("$.attentionQueue", hasSize(1)))
                .andExpect(jsonPath("$.attentionQueue[0].id", is(createdId)));
    }

    @Test
    @DisplayName("User Scoping & Isolation: User Alpha cannot see User Beta's private inbox items")
    void testUserIsolationForInboxItems() throws Exception {
        String payloadAlpha = """
                {
                    "title": "Alpha private task update",
                    "category": "UPDATES",
                    "section": "REGISTER_TODAY",
                    "itemType": "UPDATE"
                }
                """;

        mockMvc.perform(post("/api/inbox")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadAlpha))
                .andExpect(status().isCreated());

        // Alpha sees 1 item
        mockMvc.perform(get("/api/inbox")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(1)))
                .andExpect(jsonPath("$.updatesToday", hasSize(1)));

        // Beta sees 0 items
        mockMvc.perform(get("/api/inbox")
                        .session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(0)))
                .andExpect(jsonPath("$.updatesToday", hasSize(0)));
    }

    @Test
    @DisplayName("Read Operations: Mark as read and mark all read update state in database")
    void testMarkAsReadAndMarkAllRead() throws Exception {
        String payload1 = """
                {
                    "title": "Task 1",
                    "category": "UPDATES",
                    "section": "REGISTER_TODAY",
                    "itemType": "UPDATE"
                }
                """;
        String payload2 = """
                {
                    "title": "Task 2",
                    "category": "UPDATES",
                    "section": "REGISTER_TODAY",
                    "itemType": "UPDATE"
                }
                """;

        MvcResult res1 = mockMvc.perform(post("/api/inbox")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload1))
                .andExpect(status().isCreated())
                .andReturn();
        mockMvc.perform(post("/api/inbox")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload2))
                .andExpect(status().isCreated());

        String item1Id = JsonPath.read(res1.getResponse().getContentAsString(), "$.id");

        // Mark item1 as read
        mockMvc.perform(put("/api/inbox/" + item1Id + "/read")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead", is(true)));

        // Unread count is now 1
        mockMvc.perform(get("/api/inbox")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.unread", is(1)));

        // Mark all as read
        mockMvc.perform(post("/api/inbox/mark-all-read")
                        .session(sessionAlpha))
                .andExpect(status().isOk());

        // Unread count is now 0
        mockMvc.perform(get("/api/inbox")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.unread", is(0)));
    }

    @Test
    @DisplayName("State Transitions: Archive, snooze, mute, and action mutations")
    void testArchiveSnoozeAndAction() throws Exception {
        String payload = """
                {
                    "title": "Approval decision",
                    "category": "NEEDS_ACTION",
                    "section": "ATTENTION_QUEUE",
                    "itemType": "APPROVAL"
                }
                """;

        MvcResult res = mockMvc.perform(post("/api/inbox")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andReturn();

        String itemId = JsonPath.read(res.getResponse().getContentAsString(), "$.id");

        // Toggle snooze
        mockMvc.perform(put("/api/inbox/" + itemId + "/snooze")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isSnoozed", is(true)));

        // Toggle mute
        mockMvc.perform(put("/api/inbox/" + itemId + "/mute")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isMuted", is(true)));

        // Execute APPROVE action -> marks read and archives
        mockMvc.perform(post("/api/inbox/" + itemId + "/action")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"APPROVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead", is(true)))
                .andExpect(jsonPath("$.isArchived", is(true)));

        // Check archived tab shows 1 item
        mockMvc.perform(get("/api/inbox?tab=ARCHIVED")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.archived", is(1)));
    }

    @Test
    @DisplayName("Multi-Tenant Isolation: User in Org Alpha cannot mutate Org Beta's inbox item")
    void testMultiTenantIsolation() throws Exception {
        String payloadBeta = """
                {
                    "title": "Beta Confidential Item",
                    "category": "UPDATES",
                    "section": "REGISTER_TODAY",
                    "itemType": "UPDATE"
                }
                """;

        MvcResult res = mockMvc.perform(post("/api/inbox")
                        .session(sessionBeta)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadBeta))
                .andExpect(status().isCreated())
                .andReturn();

        String itemBetaId = JsonPath.read(res.getResponse().getContentAsString(), "$.id");

        // Alpha attempts to mark Beta's item as read -> 404 Not Found
        mockMvc.perform(put("/api/inbox/" + itemBetaId + "/read")
                        .session(sessionAlpha))
                .andExpect(status().isNotFound());
    }
}
