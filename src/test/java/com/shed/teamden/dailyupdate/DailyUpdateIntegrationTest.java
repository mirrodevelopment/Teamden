package com.shed.teamden.dailyupdate;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.dailyupdate.entity.DailyUpdate;
import com.shed.teamden.dailyupdate.entity.DailyUpdateMood;
import com.shed.teamden.dailyupdate.entity.DailyUpdateStatus;
import com.shed.teamden.dailyupdate.repository.DailyUpdateRepository;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.task.entity.KanbanColumn;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class DailyUpdateIntegrationTest {

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
    private DailyUpdateRepository dailyUpdateRepository;

    @Autowired
    private ActivityEventRepository activityEventRepository;

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

        String sA = UUID.randomUUID().toString().substring(0, 8);
        String sB = UUID.randomUUID().toString().substring(0, 8);

        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Standup Org Alpha " + sA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("standup_alpha_" + sA + "@teamden.org")
                .fullName("Alice Standup")
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
                .name("Standup Org Beta " + sB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("standup_beta_" + sB + "@teamden.org")
                .fullName("Bob Beta")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        MvcResult loginResultA = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Secret123!\",\"organizationId\":\"%s\"}",
                                userAlpha.getEmail(), orgAlpha.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) loginResultA.getRequest().getSession();

        MvcResult loginResultB = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Secret123!\",\"organizationId\":\"%s\"}",
                                userBeta.getEmail(), orgBeta.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) loginResultB.getRequest().getSession();
    }

    @Test
    @DisplayName("GET /api/daily-updates/today returns unsubmitted state with auto-fill suggestions when empty")
    void getTodayUpdate_initiallyEmpty() throws Exception {
        mockMvc.perform(get("/api/daily-updates/today")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submitted", is(false)))
                .andExpect(jsonPath("$.authorName", is("Alice Standup")))
                .andExpect(jsonPath("$.workCompleted", notNullValue()));
    }

    @Test
    @DisplayName("POST /api/daily-updates publishes update and persists to PostgreSQL")
    void saveDailyUpdate_persistsToDb() throws Exception {
        String payload = """
                {
                    "workCompleted": "Finalized mobile layout refactoring and added test coverage.",
                    "workPlanned": "Implement executive export engine.",
                    "blockers": "None",
                    "status": "SUBMITTED",
                    "moodTag": "ON_TRACK"
                }
                """;

        mockMvc.perform(post("/api/daily-updates")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.submitted", is(true)))
                .andExpect(jsonPath("$.workCompleted", containsString("Finalized mobile layout")))
                .andExpect(jsonPath("$.moodTag", is("ON_TRACK")));

        Optional<DailyUpdate> savedOpt = dailyUpdateRepository.findByOrganizationIdAndUserIdAndUpdateDate(
                orgAlpha.getId(), userAlpha.getId(), LocalDate.now());
        assertThat(savedOpt).isPresent();
        assertThat(savedOpt.get().getWorkCompleted()).contains("Finalized mobile layout");
        assertThat(savedOpt.get().getStatus()).isEqualTo(DailyUpdateStatus.SUBMITTED);
    }

    @Test
    @DisplayName("POST /api/daily-updates updates existing record when posted again on the same day")
    void updateDailyUpdate_modifiesExistingTodayRecord() throws Exception {
        String firstPayload = """
                {
                    "workCompleted": "Initial morning draft",
                    "workPlanned": "TBD",
                    "status": "DRAFT",
                    "moodTag": "ON_TRACK"
                }
                """;

        mockMvc.perform(post("/api/daily-updates")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(firstPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("DRAFT")));

        String updatedPayload = """
                {
                    "workCompleted": "Evening finalized standup update with full achievements",
                    "workPlanned": "Prepare sprint review tomorrow",
                    "status": "SUBMITTED",
                    "moodTag": "HIGH_VELOCITY"
                }
                """;

        mockMvc.perform(post("/api/daily-updates")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("SUBMITTED")))
                .andExpect(jsonPath("$.moodTag", is("HIGH_VELOCITY")));

        List<DailyUpdate> allUpdates = dailyUpdateRepository.findByOrganizationIdAndUpdateDateOrderByCreatedAtDesc(
                orgAlpha.getId(), LocalDate.now());
        assertThat(allUpdates).hasSize(1);
        assertThat(allUpdates.get(0).getWorkCompleted()).isEqualTo("Evening finalized standup update with full achievements");
        assertThat(allUpdates.get(0).getMoodTag()).isEqualTo(DailyUpdateMood.HIGH_VELOCITY);
    }

    @Test
    @DisplayName("POST /api/daily-updates with SUBMITTED status creates ActivityEvent in PostgreSQL")
    void publishDailyUpdate_createsActivityEvent() throws Exception {
        String payload = """
                {
                    "workCompleted": "Refactored Recent Activity live stream.",
                    "workPlanned": "Add user notifications.",
                    "status": "SUBMITTED",
                    "moodTag": "ON_TRACK"
                }
                """;

        mockMvc.perform(post("/api/daily-updates")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated());

        List<ActivityEvent> events = activityEventRepository.findAllByOrganizationIdWithDetails(orgAlpha.getId());
        assertThat(events).isNotEmpty();
        ActivityEvent latest = events.get(0);
        assertThat(latest.getEventType()).isEqualTo(ActivityEventType.DAILY_UPDATE_POSTED);
        assertThat(latest.getActionText()).isEqualTo("published daily update");
        assertThat(latest.getBadgeType()).isEqualTo("UPDATE");
        assertThat(latest.getDotColor()).isEqualTo("green");
    }

    @Test
    @DisplayName("Daily updates strictly enforce multi-tenant isolation")
    void dailyUpdate_multiTenantIsolation() throws Exception {
        String alphaPayload = """
                {
                    "workCompleted": "Confidential Alpha Update",
                    "status": "SUBMITTED"
                }
                """;

        mockMvc.perform(post("/api/daily-updates")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(alphaPayload))
                .andExpect(status().isCreated());

        // User Beta in Tenant Beta should NOT see User Alpha's update
        mockMvc.perform(get("/api/daily-updates")
                        .session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // User Beta should have their own unsubmitted today state
        mockMvc.perform(get("/api/daily-updates/today")
                        .session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.submitted", is(false)))
                .andExpect(jsonPath("$.authorName", is("Bob Beta")));
    }

    @Test
    @DisplayName("GET /api/daily-updates/suggestions auto-harvests completed and planned tasks")
    void getSuggestions_harvestsTasks() throws Exception {
        taskRepository.save(Task.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .creator(userAlpha)
                .assignee(userAlpha)
                .taskCode("TSK-01")
                .title("Complete API Documentation")
                .status(TaskStatus.COMPLETED)
                .kanbanColumn(KanbanColumn.NOW)
                .priority(TaskPriority.HIGH)
                .build());

        taskRepository.save(Task.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .creator(userAlpha)
                .assignee(userAlpha)
                .taskCode("TSK-02")
                .title("Design Mobile Navigation Rail")
                .status(TaskStatus.TODO)
                .kanbanColumn(KanbanColumn.NEXT)
                .priority(TaskPriority.MEDIUM)
                .build());

        mockMvc.perform(get("/api/daily-updates/suggestions")
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.defaultCompletedText", containsString("Complete API Documentation")))
                .andExpect(jsonPath("$.defaultPlannedText", containsString("Design Mobile Navigation Rail")));
    }
}
