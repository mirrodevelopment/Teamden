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
import java.util.ArrayList;
import java.util.List;
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

        // Explicitly seed orgAlpha with test activity records for filter testing
        seedTestActivityEvents(orgAlpha, userAlpha);
    }

    private void seedTestActivityEvents(Organization org, User user) {
        LocalDate today = LocalDate.now();
        LocalDate yesterday = today.minusDays(1);
        java.time.ZonedDateTime todayZoned = today.atStartOfDay(java.time.ZoneId.systemDefault());
        java.time.ZonedDateTime yestZoned = yesterday.atStartOfDay(java.time.ZoneId.systemDefault());

        List<ActivityEvent> testEvents = new ArrayList<>();

        // TODAY EVENTS
        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_COMPLETED)
                .entityType("TASK")
                .title("completed")
                .description("Set up staging environment")
                .actionText("completed")
                .targetTitle("Set up staging environment")
                .subMeta("Client Application / Engineering")
                .infoText("Task marked complete")
                .badgeType("COMPLETED")
                .dotColor("green")
                .eventTimestamp(todayZoned.plusHours(12).plusMinutes(46).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.PROJECT_UPDATED)
                .entityType("PROJECT")
                .title("Product brief")
                .description("Version 1.2 · 3 pages")
                .actionText("was updated")
                .targetTitle("Product brief")
                .subMeta("Product / Workspace")
                .infoText("Version 1.2 · 3 pages")
                .badgeType("DOCUMENT")
                .dotColor("silver")
                .eventTimestamp(todayZoned.plusHours(12).plusMinutes(4).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_ASSIGNED)
                .entityType("TASK")
                .title("assigned a task to")
                .description("Client feedback session · Tomorrow, 2:00 PM")
                .actionText("assigned a task to")
                .targetTitle("Priya")
                .subMeta("Website Redesign / Design Team")
                .infoText("Client feedback session\nTomorrow, 2:00 PM")
                .badgeType("ASSIGNED")
                .dotColor("blue")
                .eventTimestamp(todayZoned.plusHours(10).plusMinutes(30).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_CREATED)
                .entityType("TASK")
                .title("commented on")
                .description("The new visual direction looks great. Let's make a few minor adjustments to the icon spacing.")
                .actionText("commented on")
                .targetTitle("Design review notes")
                .subMeta("Website Redesign / Design Team")
                .quotePreview("The new visual direction looks great. Let's make a few minor adjustments to the icon spacing.")
                .badgeType("COMMENT")
                .dotColor("purple")
                .eventTimestamp(todayZoned.plusHours(9).plusMinutes(15).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.ATTENDANCE_CHECKIN)
                .entityType("ATTENDANCE")
                .title("checked in")
                .description("Checked in on-time for morning engineering standup")
                .actionText("checked in for standup")
                .targetTitle("Morning Engineering Standup")
                .subMeta("Engineering / Daily")
                .infoText("Checked in on-time for morning engineering standup")
                .badgeType("COMPLETED")
                .dotColor("green")
                .eventTimestamp(todayZoned.plusHours(8).plusMinutes(30).toInstant())
                .build());

        // YESTERDAY EVENTS
        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.PROJECT_UPDATED)
                .entityType("PROJECT")
                .title("Design guidelines")
                .description("Version 1.0 released · 12 core UI components approved")
                .actionText("published release")
                .targetTitle("Design guidelines")
                .subMeta("Design System / Workspace")
                .infoText("Version 1.0 released · 12 core UI components approved")
                .badgeType("DOCUMENT")
                .dotColor("silver")
                .eventTimestamp(yestZoned.plusHours(16).plusMinutes(20).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_ASSIGNED)
                .entityType("TASK")
                .title("assigned a task to")
                .description("Database connection pooling tuning · Engineering")
                .actionText("assigned a task to")
                .targetTitle("Alex")
                .subMeta("Infrastructure / Backend")
                .infoText("Database connection pooling tuning · High priority")
                .badgeType("ASSIGNED")
                .dotColor("blue")
                .eventTimestamp(yestZoned.plusHours(14).plusMinutes(15).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_COMPLETED)
                .entityType("TASK")
                .title("completed")
                .description("Website service card deliverable")
                .actionText("completed")
                .targetTitle("Website service card deliverable")
                .subMeta("Marketing / Web Team")
                .infoText("Deliverable submitted and accepted")
                .badgeType("COMPLETED")
                .dotColor("green")
                .eventTimestamp(yestZoned.plusHours(11).plusMinutes(45).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_CREATED)
                .entityType("TASK")
                .title("commented on")
                .description("Agreed on streamlining PR review turnaround times in sprint retro.")
                .actionText("commented on")
                .targetTitle("Sprint Retrospective Notes")
                .subMeta("Engineering / Team Cadence")
                .quotePreview("Agreed on streamlining PR review turnaround times in sprint retro.")
                .badgeType("COMMENT")
                .dotColor("purple")
                .eventTimestamp(yestZoned.plusHours(10).toInstant())
                .build());

        // LAST WEEK EVENTS
        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_COMPLETED)
                .entityType("TASK")
                .title("completed")
                .description("Wireframes & Copy Approval milestone achieved")
                .actionText("completed milestone")
                .targetTitle("Wireframes & Copy Approval")
                .subMeta("Product Design / Core")
                .infoText("All client stakeholders signed off")
                .badgeType("COMPLETED")
                .dotColor("green")
                .eventTimestamp(today.minusDays(3).atStartOfDay(java.time.ZoneId.systemDefault()).plusHours(14).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.PROJECT_CREATED)
                .entityType("PROJECT")
                .title("Architecture specification")
                .description("Initial architecture diagram and database migration plan published")
                .actionText("created document")
                .targetTitle("Architecture specification")
                .subMeta("Architecture / Technical")
                .infoText("Initial architecture diagram and database migration plan published")
                .badgeType("DOCUMENT")
                .dotColor("silver")
                .eventTimestamp(today.minusDays(4).atStartOfDay(java.time.ZoneId.systemDefault()).plusHours(11).toInstant())
                .build());

        testEvents.add(ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.TASK_CREATED)
                .entityType("TASK")
                .title("commented on")
                .description("Kick-off meeting notes and scope definition approved by stakeholders")
                .actionText("commented on")
                .targetTitle("Kick-off Meeting Scope")
                .subMeta("Strategy / Planning")
                .quotePreview("Kick-off meeting notes and scope definition approved by stakeholders")
                .badgeType("COMMENT")
                .dotColor("purple")
                .eventTimestamp(today.minusDays(6).atStartOfDay(java.time.ZoneId.systemDefault()).plusHours(15).toInstant())
                .build());

        activityEventRepository.saveAll(testEvents);
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
