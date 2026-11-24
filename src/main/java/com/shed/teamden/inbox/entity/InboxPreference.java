package com.shed.teamden.inbox.entity;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inbox_preferences", uniqueConstraints = {
        @UniqueConstraint(name = "uq_inbox_pref_user_org", columnNames = {"user_id", "organization_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboxPreference {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "notify_mentions", nullable = false)
    @Builder.Default
    private boolean notifyMentions = true;

    @Column(name = "notify_assignments", nullable = false)
    @Builder.Default
    private boolean notifyAssignments = true;

    @Column(name = "notify_decisions", nullable = false)
    @Builder.Default
    private boolean notifyDecisions = true;

    @Column(name = "notify_approvals", nullable = false)
    @Builder.Default
    private boolean notifyApprovals = true;

    @Column(name = "muted_threads", columnDefinition = "TEXT")
    private String mutedThreads;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
