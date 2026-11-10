package com.shed.teamden.activity;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class ActivityIntegrationTest {

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
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private com.shed.teamden.activity.service.ActivityService activityService;

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

    private ActivityEvent betaEvent;

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
                .name("Activity Org Alpha " + sA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("alpha_" + sA + "@activitytest.org")
                .fullName("User Alpha")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Activity Org Beta " + sB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("beta_" + sB + "@activitytest.org")
                .fullName("User Beta")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        betaEvent = activityEventRepository.save(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(orgBeta)
                .actor(userBeta)
                .eventType(ActivityEventType.TASK_COMPLETED)
                .entityType("TASK")
                .title("completed")
                .description("Beta Private Task")
                .eventTimestamp(Instant.now())
                .build());

        sessionAlpha = loginAndGetSession("alpha_" + sA + "@activitytest.org", "Secret123!");
        sessionBeta = loginAndGetSession("beta_" + sB + "@activitytest.org", "Secret123!");

        // Explicitly seed orgAlpha with baseline activity records for filter testing
        activityService.ensureBaselineActivityRecords(orgAlpha, userAlpha);
    }

    private MockHttpSession loginAndGetSession(String email, String password) throws Exception {
        String payload = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) res.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Should retrieve full activity page data with baseline seeding")
    void testGetAllActivityData() throws Exception {
        mockMvc.perform(get("/api/activity/data")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workspaceBreadcrumb").value("YOUR WORKSPACE / MOVEMENTS / AUDIT LOG"))
                .andExpect(jsonPath("$.totalCount", greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.completedCount", greaterThan(0)))
                .andExpect(jsonPath("$.documentCount", greaterThan(0)))
                .andExpect(jsonPath("$.activities").isArray());
    }

    @Test
    @DisplayName("Should filter activity events by Today")
    void testFilterByToday() throws Exception {
        mockMvc.perform(get("/api/activity/data?range=today")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedRange").value("today"))
                .andExpect(jsonPath("$.activities").isArray())
                .andExpect(jsonPath("$.activities[0].dayLabel").value("TODAY"));
    }

    @Test
    @DisplayName("Should filter activity events by Yesterday")
    void testFilterByYesterday() throws Exception {
        mockMvc.perform(get("/api/activity/data?range=yesterday")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedRange").value("yesterday"))
                .andExpect(jsonPath("$.activities").isArray())
                .andExpect(jsonPath("$.activities[0].dayLabel").value("YESTERDAY"));
    }

    @Test
    @DisplayName("Should filter activity events by Last Week")
    void testFilterByLastWeek() throws Exception {
        mockMvc.perform(get("/api/activity/data?range=last_week")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedRange").value("last_week"))
                .andExpect(jsonPath("$.totalCount", greaterThanOrEqualTo(5)));
    }

    @Test
    @DisplayName("Should filter activity events by Custom Date Range")
    void testFilterByCustomDateRange() throws Exception {
        LocalDate today = LocalDate.now();
        String from = today.minusDays(2).toString();
        String to = today.toString();

        mockMvc.perform(get("/api/activity/data?range=custom&startDate=" + from + "&endDate=" + to)
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.selectedRange").value("custom"))
                .andExpect(jsonPath("$.activities").isArray())
                .andExpect(jsonPath("$.totalCount", greaterThan(0)));
    }

    @Test
    @DisplayName("Should filter activity events by Type")
    void testFilterByTypeCompleted() throws Exception {
        mockMvc.perform(get("/api/activity/data?type=COMPLETED")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activities").isArray())
                .andExpect(jsonPath("$.activities[0].badgeType").value("COMPLETED"));
    }

    @Test
    @DisplayName("Should filter activity events by search text query")
    void testFilterBySearchQuery() throws Exception {
        mockMvc.perform(get("/api/activity/data?query=staging")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activities").isArray())
                .andExpect(jsonPath("$.totalCount", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("Multi-Tenant Isolation: User Alpha cannot access Activity Event Beta")
    void testMultiTenantActivityIsolation() throws Exception {
        mockMvc.perform(get("/api/activity/" + betaEvent.getId())
                        .session(sessionAlpha))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Activity event does not belong to the active organization")));
    }

    @Test
    @DisplayName("Purged/Empty Database Verification: Query endpoint must not auto-seed and must return empty list")
    void testEmptyActivityWhenDatabasePurged() throws Exception {
        // Create an empty organization with no activity events
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Organization emptyOrg = organizationRepository.save(Organization.builder()
                .name("Empty Org " + suffix)
                .status(OrganizationStatus.ACTIVE)
                .build());

        User emptyUser = userRepository.save(User.builder()
                .email("empty_" + suffix + "@activitytest.org")
                .fullName("Empty User")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(emptyOrg)
                .user(emptyUser)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        MockHttpSession emptySession = loginAndGetSession("empty_" + suffix + "@activitytest.org", "Secret123!");

        // Request activity page data
        mockMvc.perform(get("/api/activity/data")
                        .session(emptySession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCount").value(0))
                .andExpect(jsonPath("$.completedCount").value(0))
                .andExpect(jsonPath("$.documentCount").value(0))
                .andExpect(jsonPath("$.assignedCount").value(0))
                .andExpect(jsonPath("$.commentCount").value(0))
                .andExpect(jsonPath("$.activities", hasSize(0)));

        // Verify that the database table remains genuinely empty (NO query-time auto-seeding occurred!)
        long count = activityEventRepository.countByOrganizationId(emptyOrg.getId());
        assertThat(count).isEqualTo(0L);
    }
}
