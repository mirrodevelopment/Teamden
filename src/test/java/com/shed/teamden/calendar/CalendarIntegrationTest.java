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

@SpringBootTest
@ActiveProfiles("test")
public class CalendarIntegrationTest {

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
    private CalendarEventRepository calendarEventRepository;

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
                .email("alpha_" + suffixA + "@testcalendar.org")
                .fullName("User Alpha " + suffixA)
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgAlpha)
                .user(userAlpha)
                .role(MembershipRole.OWNER)
                .build());

        orgBeta = organizationRepository.save(Organization.builder()
                .name("Org Beta " + suffixB)
                .status(OrganizationStatus.ACTIVE)
                .build());

        userBeta = userRepository.save(User.builder()
                .email("beta_" + suffixB + "@testcalendar.org")
                .fullName("User Beta " + suffixB)
                .passwordHash(passwordEncoder.encode("Pass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(orgBeta)
                .user(userBeta)
                .role(MembershipRole.OWNER)
                .build());

        MvcResult loginAlpha = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Pass123!\",\"organizationId\":\"%s\"}",
                                userAlpha.getEmail(), orgAlpha.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionAlpha = (MockHttpSession) loginAlpha.getRequest().getSession(false);

        MvcResult loginBeta = mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"Pass123!\",\"organizationId\":\"%s\"}",
                                userBeta.getEmail(), orgBeta.getId())))
                .andExpect(status().isOk())
                .andReturn();
        sessionBeta = (MockHttpSession) loginBeta.getRequest().getSession(false);
    }

    @Test
    void testFetchCalendarEventsAutoSeedsBaseline() throws Exception {
        mockMvc.perform(get("/api/calendar/events").session(sessionAlpha))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(17))))
                .andExpect(jsonPath("$[0].title", notNullValue()))
                .andExpect(jsonPath("$[0].date", notNullValue()))
                .andExpect(jsonPath("$[0].startTime", notNullValue()));

        long count = calendarEventRepository.countByOrganizationId(orgAlpha.getId());
        assertThat(count).isGreaterThanOrEqualTo(17);
    }

    @Test
    void testCreateCalendarEvent() throws Exception {
        String newEventJson = """
                {
                    "title": "Quarterly Strategy Review",
                    "date": "2026-11-15",
                    "startTime": "10:00",
                    "endTime": "11:30",
                    "project": "Executive Ops",
                    "category": "review",
                    "colorTheme": "lavender",
                    "calendar": "brick",
                    "location": "Boardroom A",
                    "attendees": ["Alex Rivera", "Priya Kapoor"],
                    "desc": "Q4 strategic alignment session"
                }
                """;

        mockMvc.perform(post("/api/calendar/events")
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newEventJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Quarterly Strategy Review")))
                .andExpect(jsonPath("$.date", is("2026-11-15")))
                .andExpect(jsonPath("$.startTime", is("10:00")))
                .andExpect(jsonPath("$.endTime", is("11:30")))
                .andExpect(jsonPath("$.startMinutes", is(600)))
                .andExpect(jsonPath("$.endMinutes", is(690)))
                .andExpect(jsonPath("$.category", is("review")))
                .andExpect(jsonPath("$.attendees", hasSize(2)));
    }

    @Test
    void testUpdateCalendarEvent() throws Exception {
        CalendarEvent event = calendarEventRepository.save(CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .title("Initial Sync")
                .eventDate(LocalDate.parse("2026-11-12"))
                .startTime("09:00")
                .endTime("10:00")
                .startMinutes(540)
                .endMinutes(600)
                .dayOfWeek(3)
                .category("meeting")
                .colorTheme("peach")
                .calendarSource("brick")
                .build());

        String updateJson = """
                {
                    "title": "Updated Strategy Sync",
                    "startTime": "14:00",
                    "endTime": "15:30",
                    "category": "focus"
                }
                """;

        mockMvc.perform(put("/api/calendar/events/" + event.getId())
                        .session(sessionAlpha)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Updated Strategy Sync")))
                .andExpect(jsonPath("$.startTime", is("14:00")))
                .andExpect(jsonPath("$.endTime", is("15:30")))
                .andExpect(jsonPath("$.startMinutes", is(840)))
                .andExpect(jsonPath("$.endMinutes", is(930)))
                .andExpect(jsonPath("$.category", is("focus")));
    }

    @Test
    void testDeleteCalendarEvent() throws Exception {
        CalendarEvent event = calendarEventRepository.save(CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .title("Temporary Meeting")
                .eventDate(LocalDate.parse("2026-11-12"))
                .startTime("09:00")
                .endTime("10:00")
                .startMinutes(540)
                .endMinutes(600)
                .dayOfWeek(3)
                .category("meeting")
                .build());

        mockMvc.perform(delete("/api/calendar/events/" + event.getId())
                        .session(sessionAlpha)
                        .with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(calendarEventRepository.findById(event.getId())).isEmpty();
    }

    @Test
    void testMultiTenantIsolation() throws Exception {
        CalendarEvent alphaEvent = calendarEventRepository.save(CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(orgAlpha)
                .user(userAlpha)
                .title("Org Alpha Secret Roadmap")
                .eventDate(LocalDate.parse("2026-11-12"))
                .startTime("10:00")
                .endTime("11:00")
                .startMinutes(600)
                .endMinutes(660)
                .dayOfWeek(3)
                .category("meeting")
                .build());

        String updatePayload = "{\"title\":\"Hacked Title\"}";

        mockMvc.perform(put("/api/calendar/events/" + alphaEvent.getId())
                        .session(sessionBeta)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/calendar/events/" + alphaEvent.getId())
                        .session(sessionBeta)
                        .with(csrf()))
                .andExpect(status().isBadRequest());

        CalendarEvent reloaded = calendarEventRepository.findById(alphaEvent.getId()).orElse(null);
        assertThat(reloaded).isNotNull();
        assertThat(reloaded.getTitle()).isEqualTo("Org Alpha Secret Roadmap");
    }
}
