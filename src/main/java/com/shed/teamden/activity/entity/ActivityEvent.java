package com.shed.teamden.activity.entity;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "activity_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEvent {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 50)
    private ActivityEventType eventType;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "action_text", length = 100)
    private String actionText;

    @Column(name = "target_title", length = 255)
    private String targetTitle;

    @Column(name = "sub_meta", length = 255)
    private String subMeta;

    @Column(name = "info_text", length = 500)
    private String infoText;

    @Column(name = "quote_preview", columnDefinition = "TEXT")
    private String quotePreview;

    @Column(name = "badge_type", length = 50)
    private String badgeType;

    @Column(name = "dot_color", length = 30)
    private String dotColor;

    @Column(name = "event_timestamp", nullable = false, updatable = false)
    private Instant eventTimestamp;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.eventTimestamp == null) {
            this.eventTimestamp = Instant.now();
        }
    }
}
