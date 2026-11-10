package com.shed.teamden.calendar.entity;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "calendar_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "start_time", nullable = false, length = 10)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 10)
    private String endTime;

    @Column(name = "start_minutes", nullable = false)
    private Integer startMinutes;

    @Column(name = "end_minutes", nullable = false)
    private Integer endMinutes;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek;

    @Column(name = "project", length = 100)
    private String project;

    @Column(name = "subtitle", length = 100)
    private String subtitle;

    @Column(name = "category", nullable = false, length = 50)
    @Builder.Default
    private String category = "meeting";

    @Column(name = "color_theme", nullable = false, length = 30)
    @Builder.Default
    private String colorTheme = "lavender";

    @Column(name = "calendar_source", nullable = false, length = 30)
    @Builder.Default
    private String calendarSource = "brick";

    @Column(name = "icon", length = 30)
    @Builder.Default
    private String icon = "calendar";

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "attendees", columnDefinition = "TEXT")
    private String attendees;

    @Column(name = "agenda_text", columnDefinition = "TEXT")
    private String agendaText;

    @Column(name = "notes_text", columnDefinition = "TEXT")
    private String notesText;

    @Column(name = "notes_timestamp", length = 50)
    private String notesTimestamp;

    @Column(name = "decision_title", length = 255)
    private String decisionTitle;

    @Column(name = "decision_status", length = 255)
    private String decisionStatus;

    @Column(name = "followups_json", columnDefinition = "TEXT")
    private String followupsJson;

    @Column(name = "attendees_json", columnDefinition = "TEXT")
    private String attendeesJson;

    @Column(name = "organizer_name", length = 100)
    private String organizerName;

    @Column(name = "organizer_role", length = 100)
    private String organizerRole;

    @Column(name = "meeting_url", length = 255)
    private String meetingUrl;

    @Column(name = "rsvp_status", length = 50)
    @Builder.Default
    private String rsvpStatus = "Accepted";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
