package com.shed.teamden.project;

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
public class ProjectIntegrationTest {

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
                .name("Project Org Alpha " + sA)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userAlpha = userRepository.save(User.builder()
                .email("proj_alpha_" + sA + "@teamden.org")
                .fullName("Alex Lead")
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
                .name("Project Org Beta " + sB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("proj_beta_" + sB + "@teamden.org")
                .fullName("Bethany Lead")
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
        sessionAlpha = (MockHttpSession) loginResultA.getRequest().getSession(false);

        MvcResult loginResultB = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Secret123!\",\"organizationId\":\"%s\"}",
                                userBeta.getEmail(), orgBeta.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) loginResultB.getRequest().getSession(false);
    }

    @Test
    @DisplayName("GET /api/projects/options returns organization members as owners without cross-tenant leakage")
    void testGetProjectOptions() throws Exception {
        mockMvc.perform(get("/api/projects/options").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.owners", hasSize(1)))
                .andExpect(jsonPath("$.owners[0].name", is("Alex Lead")))
                .andExpect(jsonPath("$.owners[0].initials", is("AL")))
                .andExpect(jsonPath("$.statuses", hasItem("ACTIVE")))
                .andExpect(jsonPath("$.priorities", hasItem("HIGH")))
                .andExpect(jsonPath("$.healthOptions", hasItem("ON_TRACK")))
                .andExpect(jsonPath("$.projectTypes", hasItem("Engineering")));

        mockMvc.perform(get("/api/projects/options").session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.owners", hasSize(1)))
                .andExpect(jsonPath("$.owners[0].name", is("Bethany Lead")))
                .andExpect(jsonPath("$.owners[0].initials", is("BL")));
    }

    @Test
    @DisplayName("POST /api/projects creates project in DB, returns 201 Created, and logs PROJECT_CREATED activity")
    void testCreateProjectSuccess() throws Exception {
        String payload = String.format("""
                {
                    "name": "Design System 2.0",
                    "description": "Unified Neo-Editorial token standard and components",
                    "ownerId": "%s",
                    "projectType": "Design & UX",
                    "status": "ACTIVE",
                    "priority": "HIGH",
                    "health": "ON_TRACK",
                    "startDate": "2026-11-10",
                    "dueDate": "2026-12-15"
                }
                """, userAlpha.getId());

        mockMvc.perform(post("/api/projects")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name", is("Design System 2.0")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.health", is("ON_TRACK")))
                .andExpect(jsonPath("$.priority", containsString("High")))
                .andExpect(jsonPath("$.team", is("Alex Lead")));

        List<Project> projects = projectRepository.findAll();
        assertThat(projects).hasSize(1);
        Project saved = projects.get(0);
        assertThat(saved.getName()).isEqualTo("Design System 2.0");
        assertThat(saved.getOrganization().getId()).isEqualTo(orgAlpha.getId());
        assertThat(saved.getOwner().getId()).isEqualTo(userAlpha.getId());
        assertThat(saved.getProjectType()).isEqualTo("Design & UX");
        assertThat(saved.getStartDate()).isEqualTo(LocalDate.of(2026, 11, 10));
        assertThat(saved.getDueDate()).isEqualTo(LocalDate.of(2026, 12, 15));

        List<ActivityEvent> events = activityEventRepository.findAll();
        assertThat(events).hasSize(1);
        ActivityEvent event = events.get(0);
        assertThat(event.getEventType()).isEqualTo(ActivityEventType.PROJECT_CREATED);
        assertThat(event.getTargetTitle()).isEqualTo("Design System 2.0");
        assertThat(event.getOrganization().getId()).isEqualTo(orgAlpha.getId());
        assertThat(event.getActor().getId()).isEqualTo(userAlpha.getId());
    }

    @Test
    @DisplayName("POST /api/projects fails with 400 Bad Request if project name is missing")
    void testCreateProjectValidationFails() throws Exception {
        String payload = """
                {
                    "name": "   ",
                    "description": "No name project"
                }
                """;

        mockMvc.perform(post("/api/projects")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Projects are strictly tenant-isolated in dashboard view")
    void testProjectTenantIsolation() throws Exception {
        projectRepository.save(Project.builder()
                .name("Alpha Secret Project")
                .organization(orgAlpha)
                .owner(userAlpha)
                .status(ProjectStatus.ACTIVE)
                .health("ON_TRACK")
                .priority("HIGH")
                .build());

        projectRepository.save(Project.builder()
                .name("Beta Secret Project")
                .organization(orgBeta)
                .owner(userBeta)
                .status(ProjectStatus.ACTIVE)
                .health("ON_TRACK")
                .priority("MEDIUM")
                .build());

        mockMvc.perform(get("/api/projects/data").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProjects", is(1)))
                .andExpect(jsonPath("$.projects[0].name", is("Alpha Secret Project")));

        mockMvc.perform(get("/api/projects/data").session(sessionBeta))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProjects", is(1)))
                .andExpect(jsonPath("$.projects[0].name", is("Beta Secret Project")));
    }
}
