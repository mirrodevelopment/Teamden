package com.shed.teamden.project.entity;

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
@Table(name = "project_decisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectDecision {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "decision_code", length = 50)
    private String decisionCode;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "sub_title", length = 255)
    private String subTitle;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DecisionStatus status = DecisionStatus.PENDING;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "decider_id")
    private User decider;

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    @Column(name = "action_label", length = 100)
    private String actionLabel;

    @Column(name = "indicator_color", length = 30)
    @Builder.Default
    private String indicatorColor = "amber";

    @Column(name = "decided_at")
    private Instant decidedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.status == null) {
            this.status = DecisionStatus.PENDING;
        }
        if (this.indicatorColor == null) {
            this.indicatorColor = "amber";
        }
    }
}
