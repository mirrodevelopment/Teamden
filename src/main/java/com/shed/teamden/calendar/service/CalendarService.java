package com.shed.teamden.calendar.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.calendar.dto.*;
import com.shed.teamden.calendar.entity.*;
import com.shed.teamden.calendar.repository.*;
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

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final CalendarCommitmentRepository calendarCommitmentRepository;
    private final CalendarNeedsSchedulingRepository calendarNeedsSchedulingRepository;
    private final CalendarSourceRepository calendarSourceRepository;
    private final CalendarTeamAvailabilityRepository calendarTeamAvailabilityRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ActivityEventRepository activityEventRepository;

    @Transactional
    public CalendarPageDataDto getCalendarPageData() {
        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);
        ensureBaselineRecords(org, user);

        List<CalendarEvent> events = calendarEventRepository.findByOrganizationIdOrderByEventDateAscStartTimeAsc(org.getId());
        List<CalendarEventDto> eventDtos = events.stream().map(this::toDto).collect(Collectors.toList());

        List<CalendarCommitment> commitments = calendarCommitmentRepository.findByOrganizationIdOrderByDisplayOrderAsc(org.getId());
        List<UpcomingCommitmentDto> commitmentDtos = commitments.stream().map(c -> UpcomingCommitmentDto.builder()
                .id(c.getId().toString())
                .dayText(c.getDayText())
                .title(c.getTitle())
                .sub(c.getSubtitle() != null ? c.getSubtitle() : "")
                .theme(c.getTheme())
                .icon(c.getIcon())
                .targetEventId(c.getTargetEvent() != null ? c.getTargetEvent().getId().toString() : "")
                .build()).collect(Collectors.toList());

        List<CalendarNeedsScheduling> schedulingList = calendarNeedsSchedulingRepository.findByOrganizationIdAndIsResolvedFalse(org.getId());
        List<NeedsSchedulingDto> schedulingDtos = schedulingList.stream().map(s -> NeedsSchedulingDto.builder()
                .id(s.getId().toString())
                .title(s.getTitle())
                .desc(s.getDescription())
                .project(s.getProject())
                .actionLabel(s.getActionLabel())
                .build()).collect(Collectors.toList());

        List<CalendarSource> sources = calendarSourceRepository.findByOrganizationId(org.getId());
        List<ConnectedCalendarDto> sourceDtos = sources.stream().map(src -> ConnectedCalendarDto.builder()
                .id(src.getId().toString())
                .code(src.getCode())
                .name(src.getName())
                .accountEmail(src.getAccountEmail())
                .colorDot(src.getColorDot())
                .active(src.getIsActive())
                .isDefault(src.getIsDefault())
                .build()).collect(Collectors.toList());

        List<CalendarTeamAvailability> teamList = calendarTeamAvailabilityRepository.findByOrganizationIdOrderByDisplayOrderAsc(org.getId());
        List<TeamMemberAvailabilityDto> teamDtos = teamList.stream().map(t -> TeamMemberAvailabilityDto.builder()
                .id(t.getId().toString())
                .initials(t.getMemberInitials())
                .name(t.getMemberName())
                .role(t.getMemberRole())
                .theme(t.getAvatarTheme())
                .status(t.getAvailabilityStatus())
                .build()).collect(Collectors.toList());

        // Resolve next commitment card (prefer Thu 11:00 Design review or first meeting)
        CalendarEvent nextEvt = events.stream()
                .filter(e -> "meeting".equalsIgnoreCase(e.getCategory()) || "review".equalsIgnoreCase(e.getCategory()))
                .findFirst()
                .orElse(events.isEmpty() ? null : events.get(0));

        NextCommitmentDto nextDto;
        if (nextEvt != null) {
            nextDto = NextCommitmentDto.builder()
                    .title(nextEvt.getTitle())
                    .project(nextEvt.getProject() != null ? nextEvt.getProject() : "Website Redesign")
                    .timeText(String.format("Today · %s – %s", nextEvt.getStartTime(), nextEvt.getEndTime()))
                    .targetEventId(nextEvt.getId().toString())
                    .meetingUrl(nextEvt.getMeetingUrl() != null ? nextEvt.getMeetingUrl() : "https://meet.google.com/bric-des-sync")
                    .build();
        } else {
            nextDto = NextCommitmentDto.builder()
                    .title("Design review.")
                    .project("Website Redesign")
                    .timeText("Today · 11:00 – 12:00")
                    .targetEventId("")
                    .meetingUrl("https://meet.google.com/bric-des-sync")
                    .build();
        }

        return CalendarPageDataDto.builder()
                .events(eventDtos)
                .upcomingCommitments(commitmentDtos)
                .nextCommitment(nextDto)
                .needsScheduling(schedulingDtos)
                .calendars(sourceDtos)
                .teamAvailability(teamDtos)
                .build();
    }

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
                .location(request.getLocation() != null ? request.getLocation() : "Room 2A & Meet")
                .meetingUrl(request.getLocation() != null ? request.getLocation() : "https://meet.google.com/bric-des-sync")
                .attendees(attendeesJoined)
                .organizerName(user.getFullName())
                .organizerRole("Lead Designer")
                .rsvpStatus("Accepted")
                .agendaText("Align sprint milestones and confirm handoff deliverables.")
                .notesText(request.getDesc() != null ? request.getDesc() : "Detailed agenda review and task alignment.")
                .notesTimestamp("Saved just now")
                .decisionTitle(String.format("Confirmed roadmap for %s", request.getTitle()))
                .decisionStatus("Approved internally")
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
            event.setMeetingUrl(request.getLocation());
        }
        if (request.getDesc() != null) {
            event.setDescription(request.getDesc());
            event.setNotesText(request.getDesc());
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

        // Agenda items
        List<String> agendaItems = new ArrayList<>();
        if (e.getAgendaText() != null && !e.getAgendaText().isBlank()) {
            for (String item : e.getAgendaText().split("\n")) {
                if (!item.trim().isEmpty()) agendaItems.add(item.trim());
            }
        } else {
            agendaItems.add("Review homepage direction");
            agendaItems.add("Finalise mobile navigation");
            agendaItems.add("Confirm development handoff");
        }

        // Attendees list structured
        List<Object> attendeesStructured = new ArrayList<>();
        if (!attendeeList.isEmpty()) {
            for (String att : attendeeList) {
                String initials = Arrays.stream(att.split(" "))
                        .map(n -> n.length() > 0 ? n.substring(0, 1) : "")
                        .collect(Collectors.joining())
                        .toUpperCase();
                if (initials.length() > 2) initials = initials.substring(0, 2);
                attendeesStructured.add(Map.of(
                        "name", att,
                        "initials", initials,
                        "theme", "avatar-" + initials.toLowerCase(),
                        "status", "Accepted"
                ));
            }
        } else {
            attendeesStructured.add(Map.of("name", "Priya K.", "initials", "PK", "theme", "avatar-pk", "status", "Accepted"));
            attendeesStructured.add(Map.of("name", "Alex R.", "initials", "AR", "theme", "avatar-ar", "status", "Accepted"));
        }

        // Followups structured
        List<Object> followups = List.of(
                Map.of("id", "fu-1", "title", "Refine mobile navigation", "assignee", "Priya K.", "due", "Due 30 Oct", "completed", false),
                Map.of("id", "fu-2", "title", "Prepare design handoff", "assignee", "Alex R.", "due", "Due 30 Oct", "completed", false)
        );

        Map<String, String> organizer = Map.of(
                "name", e.getOrganizerName() != null ? e.getOrganizerName() : "Alex R.",
                "role", e.getOrganizerRole() != null ? e.getOrganizerRole() : "Lead Designer"
        );

        Map<String, String> decision = Map.of(
                "title", e.getDecisionTitle() != null ? e.getDecisionTitle() : "Proceed with the revised homepage layout.",
                "status", e.getDecisionStatus() != null ? e.getDecisionStatus() : "Approved internally · Client confirmation pending"
        );

        String breadcrumb = String.format("%s / EVENT %s",
                e.getProject() != null && !e.getProject().isBlank() ? e.getProject().toUpperCase() : "WORKSPACE",
                e.getId().toString().substring(0, 4).toUpperCase());

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
                .breadcrumb(breadcrumb)
                .agenda(agendaItems)
                .notes(e.getNotesText() != null ? e.getNotesText() : e.getDescription())
                .notesTimestamp(e.getNotesTimestamp() != null ? e.getNotesTimestamp() : "Saved 5 min ago")
                .decision(decision)
                .followups(followups)
                .attendeesList(attendeesStructured)
                .organizer(organizer)
                .meetingUrl(e.getMeetingUrl() != null ? e.getMeetingUrl() : "https://meet.google.com/bric-des-sync")
                .rsvp(e.getRsvpStatus() != null ? e.getRsvpStatus() : "Accepted")
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

        // 1. EXACT REFERENCE EVENTS (from user's uploaded screenshot)
        List<CalendarEvent> seeds = List.of(
                // --- MONDAY 2026-10-26 ---
                buildSeed(org, user, "Design standup", "2026-10-26", 0, "09:30", "10:00", 570, 600,
                        "Client Application", "Daily standup", "meeting", "lavender", "brick", "team",
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

                // --- TUESDAY 2026-10-27 ---
                buildSeed(org, user, "User research", "2026-10-27", 1, "09:00", "10:30", 540, 630,
                        "Client Application", "Client Application", "focus", "lime", "brick", "search",
                        "Research Lab 1", "Priya Kapoor, User Test Group",
                        "Usability testing sessions evaluating onboarding flow friction and feedback collection."),
                buildSeed(org, user, "Design critique", "2026-10-27", 1, "13:00", "14:00", 780, 840,
                        "Design Team", "Internal review", "review", "lavender", "brick", "team",
                        "Design Loft 3", "Priya Kapoor, Marcus Jones, Alex Rivera",
                        "Cross-disciplinary critique covering the mobile drawer navigation and fluid font clamps."),

                // --- WEDNESDAY 2026-10-28 ---
                buildSeed(org, user, "Product sync", "2026-10-28", 2, "10:00", "11:00", 600, 660,
                        "Client Application", "Client Application", "meeting", "lavender", "brick", "team",
                        "Executive Boardroom", "Sara Kim, Alex Rivera",
                        "Product sync reviewing scope, timeline, and Sprint 42 client deliverables."),
                buildSeed(org, user, "Homepage dev", "2026-10-28", 2, "11:30", "13:00", 690, 780,
                        "Website Redesign", "Focus session", "focus", "blue", "google", "document",
                        "Studio Desk 4", "Alex Rivera",
                        "Engineering implementation of responsive grid layouts and font clamps."),
                buildSeed(org, user, "Content review", "2026-10-28", 2, "14:30", "15:30", 870, 930,
                        "Design Guidelines", "Design Guidelines", "review", "peach", "microsoft", "document",
                        "Coffee Corner", "Marcus Jones, Alex Rivera",
                        "Review brand tone, typography hierarchy, and content guidelines."),

                // --- THURSDAY 2026-10-29 ---
                buildSeed(org, user, "Team planning", "2026-10-29", 3, "09:00", "10:00", 540, 600,
                        "Q4 priorities", "Q4 priorities", "meeting", "blue", "microsoft", "calendar",
                        "meet.google.com/team-plan", "Full Teamden Team",
                        "Align priorities, review capacity, and set sprint targets."),
                buildSeed(org, user, "Design review", "2026-10-29", 3, "11:00", "12:00", 660, 720,
                        "Website Redesign", "Website Redesign", "review", "lavender", "brick", "team",
                        "Executive Boardroom", "Priya Kapoor, Alex Rivera, Sara Kim",
                        "Review high-fidelity components with leadership team ahead of engineering handoff."),
                buildSeed(org, user, "Prototype work", "2026-10-29", 3, "14:00", "15:30", 840, 930,
                        "Website Redesign", "Focus session", "focus", "blue", "google", "box",
                        "Studio Desk 4", "Alex Rivera",
                        "Figma interactive prototyping for mobile gestures and drawer interactions."),

                // --- FRIDAY 2026-10-30 ---
                buildSeed(org, user, "Design handoff", "2026-10-30", 4, "10:00", "11:30", 600, 690,
                        "Website Redesign", "Website Redesign", "focus", "lime", "brick", "box",
                        "Dev Lab", "Alex Rivera, Front-end Team",
                        "Engineering handoff covering CSS custom properties and theme tokens."),
                buildSeed(org, user, "Client update", "2026-10-30", 4, "13:00", "14:00", 780, 840,
                        "Client Application", "Client Application", "meeting", "lavender", "brick", "team",
                        "Room 1A & Livestream", "Sara Kim, Alex Rivera, Client Team",
                        "Weekly progress update and demo of completed sprint milestone."),
                buildSeed(org, user, "Documentation", "2026-10-30", 4, "15:00", "16:00", 900, 960,
                        "Design System", "Design System", "focus", "blue", "google", "document",
                        "Library Desk 2", "Alex Rivera",
                        "Write technical specifications, migration notes, and developer guides.")
        );

        List<CalendarEvent> savedEvents = calendarEventRepository.saveAll(seeds);
        CalendarEvent kickoffEvent = savedEvents.get(0);
        CalendarEvent devEvent = savedEvents.size() > 6 ? savedEvents.get(6) : kickoffEvent;
        CalendarEvent reviewEvent = savedEvents.size() > 9 ? savedEvents.get(9) : kickoffEvent;
        CalendarEvent handoffEvent = savedEvents.size() > 11 ? savedEvents.get(11) : kickoffEvent;

        // 2. UPCOMING COMMITMENTS (4 cards)
        List<CalendarCommitment> commitments = List.of(
                CalendarCommitment.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .dayText("MON 26 OCT")
                        .title("Project kickoff")
                        .subtitle("Client Application")
                        .theme("lime")
                        .icon("flag")
                        .targetEvent(kickoffEvent)
                        .commitmentDate(LocalDate.parse("2026-10-26"))
                        .displayOrder(0)
                        .build(),
                CalendarCommitment.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .dayText("WED 28 OCT")
                        .title("Homepage development")
                        .subtitle("Task deadline")
                        .theme("blue")
                        .icon("check")
                        .targetEvent(devEvent)
                        .commitmentDate(LocalDate.parse("2026-10-28"))
                        .displayOrder(1)
                        .build(),
                CalendarCommitment.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .dayText("THU 29 OCT")
                        .title("Design review")
                        .subtitle("Website Redesign")
                        .theme("lavender")
                        .icon("team")
                        .targetEvent(reviewEvent)
                        .commitmentDate(LocalDate.parse("2026-10-29"))
                        .displayOrder(2)
                        .build(),
                CalendarCommitment.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .dayText("FRI 30 OCT")
                        .title("Design handoff")
                        .subtitle("Milestone")
                        .theme("peach")
                        .icon("box")
                        .targetEvent(handoffEvent)
                        .commitmentDate(LocalDate.parse("2026-10-30"))
                        .displayOrder(3)
                        .build()
        );
        calendarCommitmentRepository.saveAll(commitments);

        // 3. NEEDS SCHEDULING CARD
        CalendarNeedsScheduling needsSched = CalendarNeedsScheduling.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .title("Homepage approval")
                .description("A review is required, but no meeting time has been set.")
                .project("Website Redesign")
                .actionLabel("Find a time")
                .isResolved(false)
                .build();
        calendarNeedsSchedulingRepository.save(needsSched);

        // 4. CONNECTED CALENDARS
        List<CalendarSource> sources = List.of(
                CalendarSource.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .code("brick")
                        .name("Brick")
                        .accountEmail("alex@brick.design")
                        .colorDot("lime")
                        .isActive(true)
                        .isDefault(true)
                        .build(),
                CalendarSource.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .code("google")
                        .name("Google Calendar")
                        .accountEmail("alex.rivera@acme.com")
                        .colorDot("blue")
                        .isActive(true)
                        .isDefault(false)
                        .build(),
                CalendarSource.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .code("microsoft")
                        .name("Microsoft 365")
                        .accountEmail("alex.rivera@enterprise.com")
                        .colorDot("peach")
                        .isActive(true)
                        .isDefault(false)
                        .build()
        );
        calendarSourceRepository.saveAll(sources);

        // 5. TEAM AVAILABILITY MATRIX
        List<CalendarTeamAvailability> team = List.of(
                CalendarTeamAvailability.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .user(user)
                        .memberInitials("PK")
                        .memberName("Priya Kapoor")
                        .memberRole("Design Lead")
                        .avatarTheme("avatar-pk")
                        .availabilityStatus("Available")
                        .displayOrder(0)
                        .build(),
                CalendarTeamAvailability.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .user(user)
                        .memberInitials("AR")
                        .memberName("Alex Rivera")
                        .memberRole("Frontend Engineer")
                        .avatarTheme("avatar-ar")
                        .availabilityStatus("Available")
                        .displayOrder(1)
                        .build(),
                CalendarTeamAvailability.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .user(user)
                        .memberInitials("SK")
                        .memberName("Sara Kim")
                        .memberRole("Product Manager")
                        .avatarTheme("avatar-sk")
                        .availabilityStatus("In a meeting")
                        .displayOrder(2)
                        .build(),
                CalendarTeamAvailability.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .user(user)
                        .memberInitials("MJ")
                        .memberName("Marcus Jones")
                        .memberRole("Brand Designer")
                        .avatarTheme("avatar-mj")
                        .availabilityStatus("Focus time")
                        .displayOrder(3)
                        .build()
        );
        calendarTeamAvailabilityRepository.saveAll(team);
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
                .meetingUrl(location.startsWith("http") ? location : "https://" + location)
                .attendees(attendees)
                .description(desc)
                .organizerName("Alex R.")
                .organizerRole("Lead Designer")
                .rsvpStatus("Accepted")
                .agendaText("Review project milestone direction\nConfirm team deliverables\nConfirm development handoff")
                .notesText(desc)
                .notesTimestamp("Saved 5 min ago")
                .decisionTitle(String.format("Proceed with %s sprint plan.", title))
                .decisionStatus("Approved internally · Client confirmation pending")
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
