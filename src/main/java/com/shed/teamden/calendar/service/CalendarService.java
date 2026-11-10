package com.shed.teamden.calendar.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.calendar.dto.CalendarEventDto;
import com.shed.teamden.calendar.dto.CreateCalendarEventRequestDto;
import com.shed.teamden.calendar.dto.UpdateCalendarEventRequestDto;
import com.shed.teamden.calendar.entity.CalendarEvent;
import com.shed.teamden.calendar.repository.CalendarEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ActivityEventRepository activityEventRepository;

    @Transactional
    public List<CalendarEventDto> getCalendarEvents(String startDateStr, String endDateStr) {
        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);
        ensureBaselineRecords(org, user);

        List<CalendarEvent> events;
        if (startDateStr != null && !startDateStr.isBlank() && endDateStr != null && !endDateStr.isBlank()) {
            LocalDate start = LocalDate.parse(startDateStr.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            LocalDate end = LocalDate.parse(endDateStr.trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            events = calendarEventRepository.findByOrganizationIdAndEventDateBetweenOrderByEventDateAscStartTimeAsc(
                    org.getId(), start, end);
        } else {
            events = calendarEventRepository.findByOrganizationIdOrderByEventDateAscStartTimeAsc(org.getId());
        }

        return events.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public CalendarEventDto createEvent(CreateCalendarEventRequestDto request) {
        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);

        LocalDate eventDate = request.getDate() != null && !request.getDate().isBlank()
                ? LocalDate.parse(request.getDate().trim(), DateTimeFormatter.ISO_LOCAL_DATE)
                : LocalDate.now();

        String startTime = request.getStartTime() != null ? request.getStartTime().trim() : "09:00";
        String endTime = request.getEndTime() != null ? request.getEndTime().trim() : "10:00";

        int startMin = parseMinutes(startTime);
        int endMin = parseMinutes(endTime);
        if (endMin <= startMin) {
            endMin = startMin + 60;
        }

        int dayOfWeek = (eventDate.getDayOfWeek().getValue() - 1 + 7) % 7; // 0 = Monday, 6 = Sunday

        String attendeesJoined = request.getAttendees() != null
                ? String.join(", ", request.getAttendees())
                : "";

        CalendarEvent event = CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(user)
                .title(request.getTitle() != null ? request.getTitle().trim() : "Untitled Event")
                .description(request.getDesc())
                .eventDate(eventDate)
                .startTime(startTime)
                .endTime(endTime)
                .startMinutes(startMin)
                .endMinutes(endMin)
                .dayOfWeek(dayOfWeek)
                .project(request.getProject())
                .subtitle(request.getSub())
                .category(request.getCategory() != null ? request.getCategory() : "meeting")
                .colorTheme(request.getColorTheme() != null ? request.getColorTheme() : "lavender")
                .calendarSource(request.getCalendar() != null ? request.getCalendar() : "brick")
                .icon(request.getIcon() != null ? request.getIcon() : "calendar")
                .location(request.getLocation())
                .attendees(attendeesJoined)
                .build();

        CalendarEvent saved = calendarEventRepository.save(event);

        ActivityEvent activity = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.CALENDAR_EVENT_CREATED)
                .entityType("CALENDAR_EVENT")
                .entityId(saved.getId())
                .title("scheduled an event")
                .description(String.format("'%s' on %s (%s - %s)", saved.getTitle(), saved.getEventDate(), saved.getStartTime(), saved.getEndTime()))
                .build();
        activityEventRepository.save(activity);

        return toDto(saved);
    }

    @Transactional
    public CalendarEventDto updateEvent(String eventIdStr, UpdateCalendarEventRequestDto request) {
        UUID eventId;
        try {
            eventId = UUID.fromString(eventIdStr);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid event UUID: " + eventIdStr);
        }

        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);

        CalendarEvent event = calendarEventRepository.findByIdAndOrganizationId(eventId, org.getId())
                .orElseThrow(() -> new BadRequestException("Calendar event not found in this organization: " + eventId));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            event.setTitle(request.getTitle().trim());
        }
        if (request.getDate() != null && !request.getDate().isBlank()) {
            LocalDate d = LocalDate.parse(request.getDate().trim(), DateTimeFormatter.ISO_LOCAL_DATE);
            event.setEventDate(d);
            event.setDayOfWeek((d.getDayOfWeek().getValue() - 1 + 7) % 7);
        }
        if (request.getStartTime() != null && !request.getStartTime().isBlank()) {
            event.setStartTime(request.getStartTime().trim());
            event.setStartMinutes(parseMinutes(event.getStartTime()));
        }
        if (request.getEndTime() != null && !request.getEndTime().isBlank()) {
            event.setEndTime(request.getEndTime().trim());
            event.setEndMinutes(parseMinutes(event.getEndTime()));
        }
        if (event.getEndMinutes() <= event.getStartMinutes()) {
            event.setEndMinutes(event.getStartMinutes() + 60);
        }
        if (request.getProject() != null) {
            event.setProject(request.getProject());
        }
        if (request.getSub() != null) {
            event.setSubtitle(request.getSub());
        }
        if (request.getCategory() != null) {
            event.setCategory(request.getCategory());
        }
        if (request.getColorTheme() != null) {
            event.setColorTheme(request.getColorTheme());
        }
        if (request.getCalendar() != null) {
            event.setCalendarSource(request.getCalendar());
        }
        if (request.getIcon() != null) {
            event.setIcon(request.getIcon());
        }
        if (request.getLocation() != null) {
            event.setLocation(request.getLocation());
        }
        if (request.getDesc() != null) {
            event.setDescription(request.getDesc());
        }
        if (request.getAttendees() != null) {
            event.setAttendees(String.join(", ", request.getAttendees()));
        }

        CalendarEvent updated = calendarEventRepository.save(event);

        ActivityEvent activity = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.CALENDAR_EVENT_UPDATED)
                .entityType("CALENDAR_EVENT")
                .entityId(updated.getId())
                .title("updated an event")
                .description(String.format("Updated '%s'", updated.getTitle()))
                .build();
        activityEventRepository.save(activity);

        return toDto(updated);
    }

    @Transactional
    public void deleteEvent(String eventIdStr) {
        UUID eventId;
        try {
            eventId = UUID.fromString(eventIdStr);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid event UUID: " + eventIdStr);
        }

        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);

        CalendarEvent event = calendarEventRepository.findByIdAndOrganizationId(eventId, org.getId())
                .orElseThrow(() -> new BadRequestException("Calendar event not found in this organization: " + eventId));

        calendarEventRepository.delete(event);

        ActivityEvent activity = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.CALENDAR_EVENT_DELETED)
                .entityType("CALENDAR_EVENT")
                .entityId(eventId)
                .title("deleted an event")
                .description(String.format("Deleted '%s'", event.getTitle()))
                .build();
        activityEventRepository.save(activity);
    }

    public CalendarEventDto toDto(CalendarEvent e) {
        List<String> attendeeList = new ArrayList<>();
        if (e.getAttendees() != null && !e.getAttendees().isBlank()) {
            for (String a : e.getAttendees().split(",")) {
                if (!a.trim().isEmpty()) {
                    attendeeList.add(a.trim());
                }
            }
        }

        return CalendarEventDto.builder()
                .id(e.getId().toString())
                .title(e.getTitle())
                .date(e.getEventDate().toString())
                .dayOfWeek(e.getDayOfWeek())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .startMinutes(e.getStartMinutes())
                .endMinutes(e.getEndMinutes())
                .project(e.getProject() != null ? e.getProject() : "")
                .sub(e.getSubtitle() != null ? e.getSubtitle() : "")
                .category(e.getCategory())
                .colorTheme(e.getColorTheme())
                .calendar(e.getCalendarSource())
                .icon(e.getIcon())
                .location(e.getLocation() != null ? e.getLocation() : "")
                .attendees(attendeeList)
                .desc(e.getDescription() != null ? e.getDescription() : "")
                .build();
    }

    private int parseMinutes(String timeStr) {
        try {
            String[] parts = timeStr.split(":");
            return Integer.parseInt(parts[0].trim()) * 60 + Integer.parseInt(parts[1].trim());
        } catch (Exception ex) {
            return 9 * 60;
        }
    }

    public void ensureBaselineRecords(Organization org, User user) {
        long count = calendarEventRepository.countByOrganizationId(org.getId());
        if (count > 0) {
            return;
        }

        List<CalendarEvent> seeds = List.of(
                // Monday 2026-10-26
                buildSeed(org, user, "Design standup", "2026-10-26", 0, "09:30", "10:00", 570, 600,
                        "Client Application", "", "meeting", "lavender", "brick", "team",
                        "meet.google.com/bric-des-sync", "Priya Kapoor, Alex Rivera, Marcus Jones",
                        "Quick daily design standup to align on client application tickets and current deliverables."),
                buildSeed(org, user, "Homepage work", "2026-10-26", 0, "11:00", "12:30", 660, 750,
                        "Website Redesign", "Focus session", "focus", "blue", "google", "document",
                        "Studio Desk 4", "Alex Rivera",
                        "Dedicated deep work session to build out responsive homepage layouts and hero typography."),
                buildSeed(org, user, "Client review", "2026-10-26", 0, "14:00", "15:00", 840, 900,
                        "Website Redesign", "Website Redesign", "review", "peach", "brick", "team",
                        "Room 2A & Zoom", "Sara Kim, Priya Kapoor, Client Stakeholders",
                        "Present sprint milestone prototypes and collect sign-off on design system tokens."),
                buildSeed(org, user, "Marketing sync", "2026-10-26", 0, "16:00", "17:00", 960, 1020,
                        "Marketing", "Campaign planning", "meeting", "lavender", "microsoft", "monitor",
                        "meet.google.com/mkt-q4-plan", "Alex Rivera, Elena Rostova",
                        "Campaign planning and creative asset schedule for the upcoming November launch."),

                // Tuesday 2026-10-27
                buildSeed(org, user, "User research", "2026-10-27", 1, "09:00", "10:30", 540, 630,
                        "Client Application", "Client Application", "focus", "lime", "brick", "search",
                        "Research Lab 1", "Priya Kapoor, User Test Group",
                        "Usability testing sessions evaluating onboarding flow friction and feedback collection."),
                buildSeed(org, user, "Design critique", "2026-10-27", 1, "13:00", "14:00", 780, 840,
                        "Design Team", "Internal review", "review", "peach", "brick", "team",
                        "Design Loft 3", "Priya Kapoor, Marcus Jones, Alex Rivera",
                        "Cross-disciplinary critique covering the mobile drawer navigation and fluid font clamps."),
                buildSeed(org, user, "Sprint planning", "2026-10-27", 1, "15:30", "17:00", 930, 1020,
                        "Client Application", "Sprint 42 Planning", "meeting", "lavender", "google", "box",
                        "meet.google.com/sprint-42", "Sara Kim, Alex Rivera, Dev Team",
                        "Backlog refinement and commitment sizing for Sprint 42 deliverables."),

                // Wednesday 2026-10-28
                buildSeed(org, user, "Design review", "2026-10-28", 2, "10:00", "11:30", 600, 690,
                        "Website Redesign", "Website Redesign", "review", "lavender", "brick", "team",
                        "Executive Boardroom", "Priya Kapoor, Alex Rivera, Sara Kim",
                        "Review high-fidelity components with leadership team ahead of engineering handoff."),
                buildSeed(org, user, "Dev handoff", "2026-10-28", 2, "14:00", "15:30", 840, 930,
                        "Design System", "Tokens & Spec Handoff", "focus", "mint", "google", "box",
                        "meet.google.com/dev-tokens", "Alex Rivera, Front-end Team",
                        "Engineering handoff covering CSS custom properties and theme tokens."),
                buildSeed(org, user, "1:1 with Sara", "2026-10-28", 2, "16:00", "16:45", 960, 1005,
                        "Management", "Bi-weekly sync", "meeting", "peach", "microsoft", "team",
                        "Coffee Corner & Meet", "Alex Rivera, Sara Kim",
                        "Professional growth, career milestones, and workload review."),

                // Thursday 2026-10-29
                buildSeed(org, user, "Workshop: Brand assets", "2026-10-29", 3, "09:30", "11:00", 570, 660,
                        "Brand Identity", "Brand assets", "focus", "peach", "brick", "flag",
                        "Studio Studio B", "Marcus Jones, Alex Rivera",
                        "Interactive brand asset workshop standardizing SVG vectors, monochrome wordmarks, and logos."),
                buildSeed(org, user, "Architecture sync", "2026-10-29", 3, "11:30", "12:30", 690, 750,
                        "Infrastructure", "Database & Cache", "meeting", "blue", "microsoft", "monitor",
                        "meet.google.com/arch-sync", "Backend Engineers, Alex Rivera",
                        "Align on PostgreSQL 17 multi-tenant schema partitioning and caching."),
                buildSeed(org, user, "Component testing", "2026-10-29", 3, "14:30", "16:00", 870, 960,
                        "Design System", "Component testing", "focus", "lime", "brick", "check",
                        "Dev Lab", "Alex Rivera, QA Lead",
                        "Visual regression testing across all shared navigation and theme fragments."),

                // Friday 2026-10-30
                buildSeed(org, user, "Weekly retro", "2026-10-30", 4, "10:00", "11:00", 600, 660,
                        "Engineering & Design", "Sprint 41 Retrospective", "meeting", "lavender", "brick", "team",
                        "Main Amphitheater & Zoom", "Full Teamden Team",
                        "Celebrate sprint wins, review velocity, and capture continuous improvement action items."),
                buildSeed(org, user, "Documentation time", "2026-10-30", 4, "11:30", "13:00", 690, 780,
                        "Documentation", "Wiki & API reference", "focus", "mint", "google", "document",
                        "Library Desk 2", "Alex Rivera",
                        "Write technical specifications, migration notes, and developer guides."),
                buildSeed(org, user, "Demo to stakeholders", "2026-10-30", 4, "14:00", "15:00", 840, 900,
                        "Client Application", "Milestone 2 demo", "review", "blue", "brick", "monitor",
                        "Room 1A & Livestream", "Executive Sponsors, Client Team",
                        "Live interactive demonstration of the new responsive client portal and theme switcher."),
                buildSeed(org, user, "Design chapter beers", "2026-10-30", 4, "16:00", "17:00", 960, 1020,
                        "Social", "Chapter hangout", "meeting", "peach", "brick", "team",
                        "The Shed Roof Terrace", "Design & Creative Chapter",
                        "Informal end-of-week wind down with the design and creative crew on the terrace.")
        );

        calendarEventRepository.saveAll(seeds);
    }

    private CalendarEvent buildSeed(Organization org, User user, String title, String dateStr, int dayOfWeek,
                                    String start, String end, int startMin, int endMin,
                                    String project, String sub, String category, String colorTheme,
                                    String calendarSource, String icon, String location, String attendees,
                                    String desc) {
        return CalendarEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .user(user)
                .title(title)
                .eventDate(LocalDate.parse(dateStr))
                .dayOfWeek(dayOfWeek)
                .startTime(start)
                .endTime(end)
                .startMinutes(startMin)
                .endMinutes(endMin)
                .project(project)
                .subtitle(sub)
                .category(category)
                .colorTheme(colorTheme)
                .calendarSource(calendarSource)
                .icon(icon)
                .location(location)
                .attendees(attendees)
                .description(desc)
                .build();
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent() && userOpt.get().getActiveOrganizationId() != null) {
            Optional<Organization> orgOpt = organizationRepository.findById(userOpt.get().getActiveOrganizationId());
            if (orgOpt.isPresent()) {
                return orgOpt.get();
            }
        }
        List<Organization> orgs = organizationRepository.findAll();
        if (!orgs.isEmpty()) {
            return orgs.get(0);
        }
        Organization defaultOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Acme Co.")
                .status(OrganizationStatus.ACTIVE)
                .build();
        return organizationRepository.save(defaultOrg);
    }

    private User resolveCurrentUser(Organization org) {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            Optional<User> uOpt = userRepository.findById(userOpt.get().getId());
            if (uOpt.isPresent()) {
                return uOpt.get();
            }
        }
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }
        User defaultUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("SIVASURYA S")
                .email("admin@brick.local")
                .passwordHash("$2a$12$e0MYzXy/vP7J11.d3Jg1y.X9vG32g9J8qX8f0gK6hP2cQ3v5gK7a")
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(defaultUser);
    }
}
