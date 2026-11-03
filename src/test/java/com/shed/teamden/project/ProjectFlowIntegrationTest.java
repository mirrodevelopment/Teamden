package com.shed.teamden.project;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectMilestone;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectMilestoneRepository;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class ProjectFlowIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectMilestoneRepository milestoneRepository;

    @Test
    @DisplayName("Should retrieve project overview with hydrated project flow data")
    void testGetProjectOverview() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mockMvc.perform(get("/api/projects/featured-01/overview")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").isNotEmpty())
                .andExpect(jsonPath("$.specification").exists())
                .andExpect(jsonPath("$.milestonesList").isArray())
                .andExpect(jsonPath("$.workInMotion").isArray());
    }

    @Test
    @DisplayName("Should retrieve project tasks with work status and milestone groups")
    void testGetProjectTasks() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mockMvc.perform(get("/api/projects/featured-01/tasks")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.workStatus").exists())
                .andExpect(jsonPath("$.taskGroups").isArray())
                .andExpect(jsonPath("$.blockedTasks").isArray());
    }

    @Test
    @DisplayName("Should retrieve project documents with library categories")
    void testGetProjectDocuments() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mockMvc.perform(get("/api/projects/featured-01/documents")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.library").exists())
                .andExpect(jsonPath("$.library.documents").isArray());
    }

    @Test
    @Transactional
    @DisplayName("Should persist and query Project Flow milestones in the database")
    void testProjectMilestonesPersistence() {
        Organization org = organizationRepository.save(Organization.builder()
                .id(UUID.randomUUID())
                .name("Flow Test Org " + UUID.randomUUID())
                .status(OrganizationStatus.ACTIVE)
                .build());

        User user = userRepository.save(User.builder()
                .id(UUID.randomUUID())
                .fullName("Flow Lead")
                .email("lead_" + UUID.randomUUID().toString().substring(0, 8) + "@test.org")
                .passwordHash("hash")
                .status(UserStatus.ACTIVE)
                .build());

        Project project = projectRepository.save(Project.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Flow Test Project")
                .owner(user)
                .status(ProjectStatus.ACTIVE)
                .health("ON_TRACK")
                .priority("HIGH")
                .projectType("Design / Development")
                .build());

        ProjectMilestone m1 = milestoneRepository.save(ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(project)
                .seqNum(1)
                .code("01")
                .name("Discovery")
                .status(MilestoneStatus.COMPLETED)
                .dueDate(LocalDate.now().minusDays(5))
                .build());

        ProjectMilestone m2 = milestoneRepository.save(ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .project(project)
                .seqNum(2)
                .code("02")
                .name("Design")
                .status(MilestoneStatus.CURRENT)
                .dueDate(LocalDate.now().plusDays(10))
                .build());

        var list = milestoneRepository.findByProjectIdOrderBySeqNumAsc(project.getId());
        assertThat(list).hasSize(2);
        assertThat(list.get(0).getName()).isEqualTo("Discovery");
        assertThat(list.get(1).getStatus()).isEqualTo(MilestoneStatus.CURRENT);
    }
}
