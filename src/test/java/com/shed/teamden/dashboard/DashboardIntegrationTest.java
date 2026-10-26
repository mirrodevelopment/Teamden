package com.shed.teamden.dashboard;

import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.attendance.repository.AttendanceRecordRepository;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class DashboardIntegrationTest {

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
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private ActivityEventRepository activityEventRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User user;
    private Organization org;
    private MockHttpSession session;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
        activityEventRepository.deleteAll();
        attendanceRecordRepository.deleteAll();
        taskRepository.deleteAll();
        projectRepository.deleteAll();
        membershipRepository.deleteAll();
        userRepository.deleteAll();
        organizationRepository.deleteAll();

        org = organizationRepository.save(Organization.builder()
                .name("Starlight Design Studio")
                .status(OrganizationStatus.ACTIVE)
                .build());

        user = userRepository.save(User.builder()
                .fullName("Jordan Bell")
                .email("jordan@starlight.com")
                .passwordHash(passwordEncoder.encode("SecretPass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(org)
                .user(user)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // Login to obtain active session
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jordan@starlight.com\",\"password\":\"SecretPass123!\"}"))
                .andExpect(status().isOk())
                .andReturn();

        session = (MockHttpSession) loginResult.getRequest().getSession(false);
    }

    @Test
    @DisplayName("Dashboard summary should reflect real database counts, calculated progress, and tasks")
    void testDashboardSummaryMetrics() throws Exception {
        // Create an active project
        Project project = projectRepository.save(Project.builder()
                .organization(org)
                .owner(user)
                .name("Website Redesign")
                .status(ProjectStatus.ACTIVE)
                .dueDate(LocalDate.now(ZoneOffset.UTC).plusDays(14))
                .build());

        // Create 1 completed task this week
        taskRepository.save(Task.builder()
                .organization(org)
                .project(project)
                .creator(user)
                .assignee(user)
                .title("Draft wireframes")
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.COMPLETED)
                .completedAt(Instant.now())
                .build());

        // Create 1 open task
        taskRepository.save(Task.builder()
                .organization(org)
                .project(project)
                .creator(user)
                .assignee(user)
                .title("Develop navigation component")
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.IN_PROGRESS)
                .dueDate(LocalDate.now(ZoneOffset.UTC).plusDays(3))
                .build());

        mockMvc.perform(get("/api/dashboard/summary").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.kpis.activeProjects").value(1))
                .andExpect(jsonPath("$.data.kpis.openTasks").value(1))
                .andExpect(jsonPath("$.data.kpis.tasksCompletedThisWeek").value(1))
                .andExpect(jsonPath("$.data.projects", hasSize(1)))
                .andExpect(jsonPath("$.data.projects[0].name").value("Website Redesign"))
                .andExpect(jsonPath("$.data.projects[0].progressPercentage").value(50))
                .andExpect(jsonPath("$.data.projects[0].completedTasks").value(1))
                .andExpect(jsonPath("$.data.projects[0].totalTasks").value(2))
                .andExpect(jsonPath("$.data.myTasks", hasSize(2)));
    }

    @Test
    @DisplayName("Creating a project via API should persist to database and create activity event")
    void testCreateProjectApi() throws Exception {
        String json = "{\"name\":\"Client Portal 2.0\",\"description\":\"Secure client collaboration portal\",\"startDate\":\"2026-03-01\",\"dueDate\":\"2026-04-01\"}";

        mockMvc.perform(post("/api/dashboard/projects")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Client Portal 2.0"));

        assertThat(projectRepository.count()).isEqualTo(1);
        assertThat(activityEventRepository.count()).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("Creating a task via API should persist and reflect on user's my-tasks")
    void testCreateTaskApi() throws Exception {
        String json = "{\"title\":\"Setup PostgreSQL flyway migration\",\"priority\":\"URGENT\",\"description\":\"Write versioned V1 init schema\"}";

        mockMvc.perform(post("/api/dashboard/tasks")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Setup PostgreSQL flyway migration"))
                .andExpect(jsonPath("$.data.priority").value("URGENT"));

        assertThat(taskRepository.count()).isEqualTo(1);
    }

    @Test
    @DisplayName("Toggling attendance should record check-in and subsequent check-out")
    void testToggleAttendance() throws Exception {
        // First punch: Check-in
        mockMvc.perform(post("/api/dashboard/attendance/toggle").with(csrf()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedIn").value(true))
                .andExpect(jsonPath("$.data.checkInTime").isNotEmpty())
                .andExpect(jsonPath("$.data.checkOutTime").isEmpty());

        // Second punch: Check-out
        mockMvc.perform(post("/api/dashboard/attendance/toggle").with(csrf()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.checkedIn").value(true))
                .andExpect(jsonPath("$.data.checkInTime").isNotEmpty())
                .andExpect(jsonPath("$.data.checkOutTime").isNotEmpty());

        assertThat(attendanceRecordRepository.count()).isEqualTo(1);
    }
}
