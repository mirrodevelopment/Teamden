package com.shed.teamden.task;

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
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.task.entity.KanbanColumn;
import com.shed.teamden.task.entity.Task;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class TaskIntegrationTest {

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
    private Project projectAlpha;
    private MockHttpSession sessionAlpha;

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
        jdbcTemplate.execute("DELETE FROM daily_updates");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM organizations");

        String sA = UUID.randomUUID().toString().substring(0, 8);
        String sB = UUID.randomUUID().toString().substring(0, 8);

        orgAlpha = organizationRepository.save(Organization.builder()
                .name("Task Org Alpha " + sA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("task_alpha_" + sA + "@teamden.org")
                .fullName("Task User Alpha")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        projectAlpha = projectRepository.save(Project.builder()
                .name("Alpha Portal")
                .organization(orgAlpha)
                .owner(userAlpha)
                .status(ProjectStatus.ACTIVE)
                .health("ON_TRACK")
                .priority("HIGH")
                .startDate(LocalDate.now())
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Task Org Beta " + sB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("task_beta_" + sB + "@teamden.org")
                .fullName("Task User Beta")
                .passwordHash(passwordEncoder.encode("Secret123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Secret123!\",\"organizationId\":\"%s\"}",
                                userAlpha.getEmail(), orgAlpha.getId())))
                .andExpect(status().isOk())
                .andReturn();

        sessionAlpha = (MockHttpSession) loginResult.getRequest().getSession(false);
    }

    @Test
    @DisplayName("GET /api/tasks/options returns organization projects and assignees")
    void testGetTaskOptions() throws Exception {
        mockMvc.perform(get("/api/tasks/options").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects", hasSize(1)))
                .andExpect(jsonPath("$.projects[0].name", is("Alpha Portal")))
                .andExpect(jsonPath("$.assignees", hasSize(1)))
                .andExpect(jsonPath("$.assignees[0].name", is("Task User Alpha")));
    }

    @Test
    @DisplayName("POST /api/tasks creates task in DB, returns 201 Created, and logs activity")
    void testCreateTaskSuccess() throws Exception {
        String payload = String.format("""
                {
                    "title": "Design token exports and typography audit",
                    "description": "Export all design tokens to theme.css and verify zero hex usage",
                    "projectId": "%s",
                    "assigneeId": "%s",
                    "kanbanColumn": "NOW",
                    "priority": "HIGH",
                    "dueDate": "2026-11-20"
                }
                """, projectAlpha.getId(), userAlpha.getId());

        MvcResult result = mockMvc.perform(post("/api/tasks")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Design token exports and typography audit")))
                .andExpect(jsonPath("$.column", is("NOW")))
                .andExpect(jsonPath("$.columnOrder", is(1)))
                .andReturn();

        // Verify task persisted in database
        List<Task> tasks = taskRepository.findByOrganizationId(orgAlpha.getId());
        assertThat(tasks).hasSize(1);
        Task savedTask = tasks.get(0);
        assertThat(savedTask.getTitle()).isEqualTo("Design token exports and typography audit");
        assertThat(savedTask.getKanbanColumn()).isEqualTo(KanbanColumn.NOW);
        assertThat(savedTask.getProject().getId()).isEqualTo(projectAlpha.getId());
        assertThat(savedTask.getAssignee().getId()).isEqualTo(userAlpha.getId());

        // Verify Activity Event logged
        List<ActivityEvent> events = activityEventRepository.findAllByOrganizationIdWithDetails(orgAlpha.getId());
        assertThat(events).hasSize(1);
        ActivityEvent event = events.get(0);
        assertThat(event.getEventType()).isEqualTo(ActivityEventType.TASK_CREATED);
        assertThat(event.getTargetTitle()).isEqualTo("Design token exports and typography audit");
    }

    @Test
    @DisplayName("POST /api/tasks throws 400 when assigning to project from another organization")
    void testCreateTaskTenantIsolation() throws Exception {
        Project betaProject = projectRepository.save(Project.builder()
                .name("Beta Restricted Project")
                .organization(orgBeta)
                .owner(userBeta)
                .status(ProjectStatus.ACTIVE)
                .build());

        String payload = String.format("""
                {
                    "title": "Malicious Cross-Tenant Task",
                    "projectId": "%s",
                    "kanbanColumn": "NOW"
                }
                """, betaProject.getId());

        mockMvc.perform(post("/api/tasks")
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }
}
