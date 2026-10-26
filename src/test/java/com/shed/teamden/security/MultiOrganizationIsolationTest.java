package com.shed.teamden.security;

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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class MultiOrganizationIsolationTest {

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
    private AttendanceRecordRepository attendanceRecordRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Organization orgAlpha;
    private Organization orgBeta;

    private User userAlpha;
    private User userBeta;

    private Project projectAlpha;
    private Project projectBeta;

    private MockHttpSession sessionAlpha;
    private MockHttpSession sessionBeta;

    private String alphaOrgName;
    private String alphaFullName;
    private String alphaEmail;
    private String alphaPassword;

    private String betaOrgName;
    private String betaFullName;
    private String betaEmail;
    private String betaPassword;

    private String projectAlphaName;
    private String taskAlphaTitle;
    private String projectBetaName;
    private String taskBetaTitle;

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

        String suffixAlpha = UUID.randomUUID().toString().substring(0, 8);
        alphaOrgName = "Org Alpha " + suffixAlpha;
        alphaFullName = "User Alpha " + suffixAlpha;
        alphaEmail = "alpha_" + suffixAlpha + "@testisolation.org";
        alphaPassword = "AlphaPwd" + suffixAlpha + "!";

        String suffixBeta = UUID.randomUUID().toString().substring(0, 8);
        betaOrgName = "Org Beta " + suffixBeta;
        betaFullName = "User Beta " + suffixBeta;
        betaEmail = "beta_" + suffixBeta + "@testisolation.org";
        betaPassword = "BetaPwd" + suffixBeta + "!";

        projectAlphaName = "Project Alpha " + suffixAlpha;
        taskAlphaTitle = "Task Alpha " + suffixAlpha;
        projectBetaName = "Project Beta " + suffixBeta;
        taskBetaTitle = "Task Beta " + suffixBeta;

        // 1. Create Organization Alpha & User Alpha
        orgAlpha = organizationRepository.save(Organization.builder()
                .name(alphaOrgName)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .fullName(alphaFullName)
                .email(alphaEmail)
                .passwordHash(passwordEncoder.encode(alphaPassword))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // 2. Create Organization Beta & User Beta
        orgBeta = organizationRepository.save(Organization.builder()
                .name(betaOrgName)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .fullName(betaFullName)
                .email(betaEmail)
                .passwordHash(passwordEncoder.encode(betaPassword))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // 3. Create isolated records in Alpha
        projectAlpha = projectRepository.save(Project.builder()
                .organization(orgAlpha)
                .owner(userAlpha)
                .name(projectAlphaName)
                .status(ProjectStatus.ACTIVE)
                .build());

        taskRepository.save(Task.builder()
                .organization(orgAlpha)
                .project(projectAlpha)
                .creator(userAlpha)
                .assignee(userAlpha)
                .title(taskAlphaTitle)
                .priority(TaskPriority.HIGH)
                .status(TaskStatus.IN_PROGRESS)
                .build());

        // 4. Create isolated records in Beta
        projectBeta = projectRepository.save(Project.builder()
                .organization(orgBeta)
                .owner(userBeta)
                .name(projectBetaName)
                .status(ProjectStatus.ACTIVE)
                .build());

        taskRepository.save(Task.builder()
                .organization(orgBeta)
                .project(projectBeta)
                .creator(userBeta)
                .assignee(userBeta)
                .title(taskBetaTitle)
                .priority(TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .build());

        // Login as User Alpha
        MvcResult resAlpha = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + alphaEmail + "\",\"password\":\"" + alphaPassword + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) resAlpha.getRequest().getSession(false);

        // Login as User Beta
        MvcResult resBeta = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + betaEmail + "\",\"password\":\"" + betaPassword + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) resBeta.getRequest().getSession(false);
    }

    @Test
    @DisplayName("User Alpha must only see Organization Alpha data and metrics")
    void testUserAlphaIsolation() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userProfile.activeOrganizationName").value(alphaOrgName))
                .andExpect(jsonPath("$.data.kpis.activeProjects").value(1))
                .andExpect(jsonPath("$.data.kpis.openTasks").value(1))
                .andExpect(jsonPath("$.data.projects", hasSize(1)))
                .andExpect(jsonPath("$.data.projects[0].name").value(projectAlphaName))
                .andExpect(jsonPath("$.data.myTasks", hasSize(1)))
                .andExpect(jsonPath("$.data.myTasks[0].title").value(taskAlphaTitle));
    }

    @Test
    @DisplayName("User Beta must only see Organization Beta data and metrics")
    void testUserBetaIsolation() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary").session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userProfile.activeOrganizationName").value(betaOrgName))
                .andExpect(jsonPath("$.data.kpis.activeProjects").value(1))
                .andExpect(jsonPath("$.data.kpis.openTasks").value(1))
                .andExpect(jsonPath("$.data.projects", hasSize(1)))
                .andExpect(jsonPath("$.data.projects[0].name").value(projectBetaName))
                .andExpect(jsonPath("$.data.myTasks", hasSize(1)))
                .andExpect(jsonPath("$.data.myTasks[0].title").value(taskBetaTitle));
    }

    @Test
    @DisplayName("User Alpha cannot assign a task to Project Beta belonging to another organization")
    void testCrossOrganizationTaskCreationRejected() throws Exception {
        String json = "{\"title\":\"Malicious Cross-Org Task\",\"projectId\":\"" + projectBeta.getId() + "\",\"priority\":\"HIGH\"}";

        mockMvc.perform(post("/api/dashboard/tasks")
                        .with(csrf())
                        .session(sessionAlpha)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Project not found in this organization")));
    }
}
