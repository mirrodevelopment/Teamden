package com.shed.teamden.calendar;

import com.shed.teamden.calendar.entity.CalendarEvent;
import com.shed.teamden.calendar.repository.CalendarEventRepository;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the Calendar Meeting Detail endpoints.
 * Tests GET /api/calendar/events/{id}, PATCH notes/agenda/decision/followups.
 * Uses the existing CalendarEvent entity — no new DB tables required.
 */
@SpringBootTest
@ActiveProfiles("test")
public class MeetingDetailIntegrationTest {

    @Autowired private WebApplicationContext context;
    private MockMvc mockMvc;

    @Autowired private UserRepository userRepository;
    @Autowired private OrganizationRepository organizationRepository;
    @Autowired private OrganizationMembershipRepository membershipRepository;
    @Autowired private CalendarEventRepository calendarEventRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private Organization orgA;
    private Organization orgB;
    private User userA;
    private User userB;
    private MockHttpSession sessionA;
    private MockHttpSession sessionB;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        // Clean up in FK-safe order
        jdbcTemplate.execute("DELETE FROM task_linked_documents");
        jdbcTemplate.execute("DELETE FROM employee_shared_documents");
        jdbcTemplate.execute("DELETE FROM employee_collaborations");
        jdbcTemplate.execute("DELETE FROM employee_responsibilities");
        jdbcTemplate.execute("DELETE FROM inbox_items");
        jdbcTemplate.execute("DELETE FROM inbox_preferences");
        jdbcTemplate.execute("DELETE FROM user_pinned_projects");
        jdbcTemplate.execute("DELETE FROM workspace_role_permissions");
        jdbcTemplate.execute("DELETE FROM workspace_security_policies");
        jdbcTemplate.execute("DELETE FROM workspace_integrations");
        jdbcTemplate.execute("DELETE FROM workspace_settings");
        jdbcTemplate.execute("DELETE FROM workspace_roles");
        jdbcTemplate.execute("DELETE FROM employees");
        jdbcTemplate.execute("DELETE FROM departments");
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
        jdbcTemplate.execute("DELETE FROM notifications");
        jdbcTemplate.execute("DELETE FROM users");
        jdbcTemplate.execute("DELETE FROM organizations");

        String suffixA = UUID.randomUUID().toString().substring(0, 8);
        String suffixB = UUID.randomUUID().toString().substring(0, 8);

        orgA = organizationRepository.save(Organization.builder()
                .name("Org Meeting A " + suffixA).status(OrganizationStatus.ACTIVE).build());

        userA = userRepository.save(User.builder()
                .email("mtg_a_" + suffixA + "@test.org")
                .fullName("Meeting User A")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE).build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgA).user(userA).role(MembershipRole.OWNER).build());

        orgB = organizationRepository.save(Organization.builder()
                .name("Org Meeting B " + suffixB).status(OrganizationStatus.ACTIVE).build());

        userB = userRepository.save(User.builder()
                .email("mtg_b_" + suffixB + "@test.org")
                .fullName("Meeting User B")
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE).build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgB).user(userB).role(MembershipRole.OWNER).build());

        MvcResult loginA = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Pass123!\",\"organizationId\":\"%s\"}",
                                userA.getEmail(), orgA.getId())))
                .andExpect(status().isOk()).andReturn();
        sessionA = (MockHttpSession) loginA.getRequest().getSession(false);

        MvcResult loginB = mockMvc.perform(post("/api/auth/login").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Pass123!\",\"organizationId\":\"%s\"}",
                                userB.getEmail(), orgB.getId())))
                .andExpect(status().isOk()).andReturn();
        sessionB = (MockHttpSession) loginB.getRequest().getSession(false);
    }

    // ── Helper to create an event in orgA ────────────────────────
    private CalendarEvent createEvent(String title) {
        return calendarEventRepository.save(CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(orgA)
                .user(userA)
                .title(title)
                .description("Design review meeting for homepage updates.")
                .eventDate(LocalDate.of(2026, 10, 29))
                .startTime("11:00")
                .endTime("12:00")
                .startMinutes(660)
                .endMinutes(720)
                .dayOfWeek(3)
                .project("Website Redesign")
                .category("meeting")
                .colorTheme("lavender")
                .calendarSource("brick")
                .icon("calendar")
                .agendaText("Homepage direction\nMobile navigation\nEngineering handoff")
                .notesText("We reviewed the updated homepage structure.")
                .decisionTitle("Proceed with the revised homepage layout.")
                .decisionStatus("Approved internally · Client confirmation pending")
                .build());
    }

    // ── Test: GET single event ────────────────────────────────────
    @Test
    void testGetEventById_returnsFullDetail() throws Exception {
        CalendarEvent event = createEvent("design review");

        mockMvc.perform(get("/api/calendar/events/" + event.getId()).session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(event.getId().toString())))
                .andExpect(jsonPath("$.title", is("design review")))
                .andExpect(jsonPath("$.project", is("Website Redesign")))
                .andExpect(jsonPath("$.agenda", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$.notes", notNullValue()))
                .andExpect(jsonPath("$.decision", notNullValue()));
    }

    // ── Test: PATCH notes ─────────────────────────────────────────
    @Test
    void testPatchNotes_savesNotesToEvent() throws Exception {
        CalendarEvent event = createEvent("weekly sync");
        String newNotes = "<p>New meeting notes from the team.</p>";

        mockMvc.perform(patch("/api/calendar/events/" + event.getId() + "/notes").session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"notes\":\"" + newNotes.replace("\"", "\\\"") + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("saved")));

        CalendarEvent updated = calendarEventRepository.findById(event.getId()).orElseThrow();
        assertThat(updated.getNotesText()).isEqualTo(newNotes);
    }

    // ── Test: PATCH agenda ────────────────────────────────────────
    @Test
    void testPatchAgenda_savesAgendaToEvent() throws Exception {
        CalendarEvent event = createEvent("design sprint kickoff");
        String agenda = "Intro\nGoals\nTimeline";

        mockMvc.perform(patch("/api/calendar/events/" + event.getId() + "/agenda").session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"agenda\":\"" + agenda.replace("\n", "\\n") + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("saved")));

        CalendarEvent updated = calendarEventRepository.findById(event.getId()).orElseThrow();
        assertThat(updated.getAgendaText()).isEqualTo(agenda);
    }

    // ── Test: PATCH decision ──────────────────────────────────────
    @Test
    void testPatchDecision_savesDecision() throws Exception {
        CalendarEvent event = createEvent("product review");

        mockMvc.perform(patch("/api/calendar/events/" + event.getId() + "/decision").session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Launch version 2\",\"status\":\"Approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("saved")));

        CalendarEvent updated = calendarEventRepository.findById(event.getId()).orElseThrow();
        assertThat(updated.getDecisionTitle()).isEqualTo("Launch version 2");
        assertThat(updated.getDecisionStatus()).isEqualTo("Approved");
    }

    // ── Test: PATCH followups ─────────────────────────────────────
    @Test
    void testPatchFollowups_savesFollowupsJson() throws Exception {
        CalendarEvent event = createEvent("planning session");
        String followupsJson = "[{\"id\":\"fu-1\",\"title\":\"Write spec\",\"assignee\":\"Alex\",\"due\":\"30 Oct\",\"completed\":false}]";

        mockMvc.perform(patch("/api/calendar/events/" + event.getId() + "/followups").session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"followups\":\"" + followupsJson.replace("\"", "\\\"") + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("saved")));

        CalendarEvent updated = calendarEventRepository.findById(event.getId()).orElseThrow();
        assertThat(updated.getFollowupsJson()).contains("Write spec");
    }

    // ── Test: Multi-tenant isolation ──────────────────────────────
    @Test
    void testGetEvent_cannotAccessOtherOrgEvent() throws Exception {
        // Create event in orgA
        CalendarEvent eventA = createEvent("private meeting");

        // userB (orgB) tries to access orgA's event — should get 400 (not found in org)
        mockMvc.perform(get("/api/calendar/events/" + eventA.getId()).session(sessionB))
                .andExpect(status().isBadRequest());
    }

    // ── Test: Full update flow via PUT ────────────────────────────
    @Test
    void testPutEvent_updatesEventFields() throws Exception {
        CalendarEvent event = createEvent("original title");

        mockMvc.perform(put("/api/calendar/events/" + event.getId()).session(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"updated title\",\"project\":\"New Project\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("updated title")))
                .andExpect(jsonPath("$.project", is("New Project")));
    }

    // ── Test: Delete event ────────────────────────────────────────
    @Test
    void testDeleteEvent_removesEvent() throws Exception {
        CalendarEvent event = createEvent("event to delete");

        mockMvc.perform(delete("/api/calendar/events/" + event.getId()).session(sessionA)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(calendarEventRepository.findById(event.getId())).isEmpty();
    }

    // ── Test: GET event with defaults when no notes/agenda ────────
    @Test
    void testGetEvent_returnsSensibleDefaults() throws Exception {
        CalendarEvent event = calendarEventRepository.save(CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(orgA)
                .user(userA)
                .title("minimal meeting")
                .eventDate(LocalDate.now())
                .startTime("10:00").endTime("11:00")
                .startMinutes(600).endMinutes(660)
                .dayOfWeek(1)
                .category("meeting").colorTheme("lavender").calendarSource("brick").icon("calendar")
                .build());

        mockMvc.perform(get("/api/calendar/events/" + event.getId()).session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(event.getId().toString())))
                .andExpect(jsonPath("$.title", is("minimal meeting")))
                // Agenda should still return default items
                .andExpect(jsonPath("$.agenda", hasSize(greaterThan(0))));
    }
}
