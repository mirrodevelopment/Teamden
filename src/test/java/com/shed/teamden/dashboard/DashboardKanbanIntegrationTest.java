package com.shed.teamden.dashboard;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.dashboard.dto.MoveTaskRequestDto;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class DashboardKanbanIntegrationTest {

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
    private TaskRepository taskRepository;

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

    private Task taskAlphaNow;
    private Task taskBetaNow;

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

        String suffixA = UUID.randomUUID().toString().substring(0, 8);
        String suffixB = UUID.randomUUID().toString().substring(0, 8);

        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Org Alpha " + suffixA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("alpha_" + suffixA + "@testkanban.org")
                .fullName("User Alpha " + suffixA)
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Org Beta " + suffixB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("beta_" + suffixB + "@testkanban.org")
                .fullName("User Beta " + suffixB)
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        Project projAlpha = projectRepository.save(Project.builder()
                .organization(orgAlpha)
                .name("Alpha Project")
                .status(ProjectStatus.ACTIVE)
                .owner(userAlpha)
                .build());

        Project projBeta = projectRepository.save(Project.builder()
                .organization(orgBeta)
                .name("Beta Project")
                .status(ProjectStatus.ACTIVE)
                .owner(userBeta)
                .build());

        taskRepository.save(Task.builder()
                .organization(orgAlpha)
                .project(projAlpha)
                .creator(userAlpha)
                .assignee(userAlpha)
                .title("Finalise the website service card")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .kanbanColumn(KanbanColumn.NOW)
                .columnOrder(0)
                .dueDate(LocalDate.of(2026, 10, 25))
                .build());

        taskAlphaNow = taskRepository.save(Task.builder()
                .organization(orgAlpha)
                .project(projAlpha)
                .creator(userAlpha)
                .assignee(userAlpha)
                .title("Alpha Kanban Task")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .kanbanColumn(KanbanColumn.NOW)
                .columnOrder(1)
                .dueDate(LocalDate.now())
                .build());

        taskBetaNow = taskRepository.save(Task.builder()
                .organization(orgBeta)
                .project(projBeta)
                .creator(userBeta)
                .assignee(userBeta)
                .title("Beta Kanban Task")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.TODO)
                .kanbanColumn(KanbanColumn.NOW)
                .columnOrder(1)
                .dueDate(LocalDate.now())
                .build());

        sessionAlpha = loginAndGetSession("alpha_" + suffixA + "@testkanban.org", "Pass123!");
        sessionBeta = loginAndGetSession("beta_" + suffixB + "@testkanban.org", "Pass123!");
    }

    private MockHttpSession loginAndGetSession(String email, String password) throws Exception {
        String loginPayload = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Should retrieve categorized Kanban tasks across NOW, NEXT, and LATER")
    void testDashboardDataReturnsCategorizedTasks() throws Exception {
        mockMvc.perform(get("/api/dashboard/data").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nowTasks").isArray())
                .andExpect(jsonPath("$.nextTasks").isArray())
                .andExpect(jsonPath("$.laterTasks").isArray())
                .andExpect(jsonPath("$.nowTasks[0].title").value("Alpha Kanban Task"))
                .andExpect(jsonPath("$.nowTasks[0].column").value("NOW"));
    }

    @Test
    @DisplayName("Should move task from NOW to NEXT and persist in database")
    void testMoveTaskFromNowToNext() throws Exception {
        String moveRequestJson = "{\"targetColumn\":\"NEXT\",\"targetIndex\":2}";

        mockMvc.perform(patch("/api/dashboard/tasks/" + taskAlphaNow.getId() + "/move")
                        .with(csrf())
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moveRequestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.column").value("NEXT"))
                .andExpect(jsonPath("$.columnOrder").value(2));

        Task reloaded = taskRepository.findById(taskAlphaNow.getId()).orElseThrow();
        assertThat(reloaded.getKanbanColumn()).isEqualTo(KanbanColumn.NEXT);
        assertThat(reloaded.getColumnOrder()).isEqualTo(2);

        List<ActivityEvent> events = activityEventRepository.findRecentByOrganizationId(orgAlpha.getId(), org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(events).isNotEmpty();
        assertThat(events.get(0).getEventType()).isEqualTo(ActivityEventType.TASK_MOVED);
    }

    @Test
    @DisplayName("Should move task to LATER column")
    void testMoveTaskToLater() throws Exception {
        String moveRequestJson = "{\"targetColumn\":\"LATER\"}";

        mockMvc.perform(patch("/api/dashboard/tasks/" + taskAlphaNow.getId() + "/move")
                        .with(csrf())
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moveRequestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.column").value("LATER"));

        Task reloaded = taskRepository.findById(taskAlphaNow.getId()).orElseThrow();
        assertThat(reloaded.getKanbanColumn()).isEqualTo(KanbanColumn.LATER);
    }

    @Test
    @DisplayName("User Alpha cannot move a task belonging to Organization Beta (Multi-Tenant Isolation)")
    void testMoveTaskMultiTenantIsolation() throws Exception {
        String moveRequestJson = "{\"targetColumn\":\"LATER\"}";

        mockMvc.perform(patch("/api/dashboard/tasks/" + taskBetaNow.getId() + "/move")
                        .with(csrf())
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(moveRequestJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Task does not belong to the active organization")));
    }

    @Test
    @DisplayName("Should toggle task completion status")
    void testToggleTaskCompletion() throws Exception {
        mockMvc.perform(patch("/api/dashboard/tasks/" + taskAlphaNow.getId() + "/toggle")
                        .with(csrf())
                        .session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed").value(true));

        Task reloaded = taskRepository.findById(taskAlphaNow.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(TaskStatus.COMPLETED);
    }

    @Test
    @DisplayName("User Alpha cannot toggle a task belonging to Organization Beta (Multi-Tenant Isolation)")
    void testToggleTaskMultiTenantIsolation() throws Exception {
        mockMvc.perform(patch("/api/dashboard/tasks/" + taskBetaNow.getId() + "/toggle")
                        .with(csrf())
                        .session(sessionAlpha))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Task does not belong to the active organization")));

        Task unchanged = taskRepository.findById(taskBetaNow.getId()).orElseThrow();
        assertThat(unchanged.getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    @DisplayName("Toggle task with invalid ID format should return 400 Bad Request")
    void testToggleTaskInvalidId() throws Exception {
        mockMvc.perform(patch("/api/dashboard/tasks/not-a-valid-uuid/toggle")
                        .with(csrf())
                        .session(sessionAlpha))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Invalid task ID format")));
    }

    @Test
    @DisplayName("Toggle non-existent task should return 404 Not Found")
    void testToggleTaskNotFound() throws Exception {
        mockMvc.perform(patch("/api/dashboard/tasks/" + UUID.randomUUID() + "/toggle")
                        .with(csrf())
                        .session(sessionAlpha))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Task not found")));
    }

    @Test
    @DisplayName("Should add new task to specified Kanban column")
    void testAddTaskToSpecificColumn() throws Exception {
        String addPayload = "{\"column\":\"LATER\",\"title\":\"Performance Benchmarking\",\"tag\":\"General\"}";

        mockMvc.perform(post("/api/dashboard/tasks")
                        .with(csrf())
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(addPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.column").value("LATER"))
                .andExpect(jsonPath("$.title").value("Performance Benchmarking"));

        List<Task> orgTasks = taskRepository.findByOrganizationId(orgAlpha.getId(), null);
        Task created = orgTasks.stream()
                .filter(t -> t.getTitle().equals("Performance Benchmarking"))
                .findFirst()
                .orElse(null);

        assertThat(created).isNotNull();
        assertThat(created.getKanbanColumn()).isEqualTo(KanbanColumn.LATER);
    }
}
