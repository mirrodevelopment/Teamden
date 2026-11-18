package com.shed.teamden.notification;

import com.shed.teamden.notification.dto.NotificationDto;
import com.shed.teamden.notification.entity.Notification;
import com.shed.teamden.notification.repository.NotificationRepository;
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
public class NotificationIntegrationTest {

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
    private NotificationRepository notificationRepository;

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
    @DisplayName("Fetch notifications automatically seeds defaults and returns authentic counts and sections")
    void testFetchNotificationsAutoSeedsAndReturnsCounts() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(7)))
                .andExpect(jsonPath("$.counts.needsAction", is(3)))
                .andExpect(jsonPath("$.counts.updates", is(4)))
                .andExpect(jsonPath("$.attentionQueue", hasSize(3)))
                .andExpect(jsonPath("$.updatesToday", hasSize(3)))
                .andExpect(jsonPath("$.updatesEarlier", hasSize(1)))
                .andExpect(jsonPath("$.activeItem.title", is("Brand identity approval")))
                .andExpect(jsonPath("$.activeItem.projectTitle", is("Brand Development")))
                .andExpect(jsonPath("$.activeItem.requesterName", is("Peter K.")))
                .andExpect(jsonPath("$.activeItem.supportingDocTitle", is("Brand Identity Guidelines")));
    }

    @Test
    @DisplayName("Filter notifications by tab and secondary filters")
    void testFilterByTabAndSecondaryFilter() throws Exception {
        // Tab: NEEDS_ACTION
        mockMvc.perform(get("/api/notifications")
                        .param("tab", "NEEDS_ACTION")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attentionQueue", hasSize(3)))
                .andExpect(jsonPath("$.updatesToday", hasSize(0)));

        // Tab: UPDATES
        mockMvc.perform(get("/api/notifications")
                        .param("tab", "UPDATES")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attentionQueue", hasSize(0)))
                .andExpect(jsonPath("$.updatesToday", hasSize(3)))
                .andExpect(jsonPath("$.updatesEarlier", hasSize(1)));

        // Filter: MENTIONS
        mockMvc.perform(get("/api/notifications")
                        .param("filter", "MENTIONS")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.updatesToday", hasSize(1)))
                .andExpect(jsonPath("$.updatesToday[0].title", containsString("mentioned you")));
    }

    @Test
    @DisplayName("Mark single notification and all notifications as read")
    void testMarkAsReadAndMarkAllAsRead() throws Exception {
        // First seed
        mockMvc.perform(get("/api/notifications").session(sessionAlpha))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(orgAlpha.getId());
        assertThat(notifs).isNotEmpty();
        UUID firstId = notifs.get(0).getId();

        // Mark single as read
        mockMvc.perform(put("/api/notifications/" + firstId + "/read")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read", is(true)));

        // Mark all as read
        mockMvc.perform(post("/api/notifications/mark-all-read")
                        .session(sessionAlpha))
                .andExpect(status().isOk());

        // Verify unread count is 0
        mockMvc.perform(get("/api/notifications").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.unread", is(0)));
    }

    @Test
    @DisplayName("Archive, snooze and action execution")
    void testArchiveSnoozeAndAction() throws Exception {
        // Seed
        mockMvc.perform(get("/api/notifications").session(sessionAlpha))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(orgAlpha.getId());
        UUID id = notifs.get(0).getId();

        // Archive
        mockMvc.perform(put("/api/notifications/" + id + "/archive")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.archived", is(true)));

        // Check archived tab has 1
        mockMvc.perform(get("/api/notifications")
                        .param("tab", "ARCHIVED")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.archived", is(1)));

        // Snooze
        UUID id2 = notifs.get(1).getId();
        mockMvc.perform(put("/api/notifications/" + id2 + "/snooze")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.snoozed", is(true)));

        // Execute Action
        UUID id3 = notifs.get(2).getId();
        mockMvc.perform(post("/api/notifications/" + id3 + "/action")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\":\"APPROVE\"}")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read", is(true)))
                .andExpect(jsonPath("$.archived", is(true)));
    }

    @Test
    @DisplayName("Multi-tenant isolation for notifications across organizations")
    void testMultiTenantIsolation() throws Exception {
        // Seed Alpha
        mockMvc.perform(get("/api/notifications").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(7)));

        // Seed Beta
        mockMvc.perform(get("/api/notifications").session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.counts.all", is(7)));

        List<Notification> alphaNotifs = notificationRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(orgAlpha.getId());
        List<Notification> betaNotifs = notificationRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(orgBeta.getId());

        assertThat(alphaNotifs).hasSize(7);
        assertThat(betaNotifs).hasSize(7);
        assertThat(alphaNotifs.get(0).getOrganization().getId()).isEqualTo(orgAlpha.getId());
        assertThat(betaNotifs.get(0).getOrganization().getId()).isEqualTo(orgBeta.getId());

        // Alpha cannot mutate Beta's notification
        UUID betaId = betaNotifs.get(0).getId();
        mockMvc.perform(put("/api/notifications/" + betaId + "/read")
                        .session(sessionAlpha))
                .andExpect(status().isNotFound());
    }
}
