package com.shed.teamden.inbox.entity;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "inbox_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboxItem {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "section", nullable = false, length = 50)
    private String section; // ATTENTION_QUEUE, REGISTER_TODAY, REGISTER_EARLIER

    @Column(name = "category", nullable = false, length = 50)
    private String category; // NEEDS_ACTION, UPDATES, ARCHIVED

    @Column(name = "filter_type", nullable = false, length = 50)
    @Builder.Default
    private String filterType = "ALL"; // ALL, UNREAD, MENTIONS, FOLLOWING

    @Column(name = "item_type", nullable = false, length = 50)
    private String itemType; // APPROVAL, FEEDBACK, HANDOFF, MENTION, ASSIGNMENT, DECISION, UPDATE, CALENDAR

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "subtitle", length = 255)
    private String subtitle;

    @Column(name = "quote", columnDefinition = "TEXT")
    private String quote;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "project_title", length = 255)
    private String projectTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @org.hibernate.annotations.OnDelete(action = org.hibernate.annotations.OnDeleteAction.SET_NULL)
    private Project project;

    @Column(name = "requester_name", length = 100)
    private String requesterName;

    @Column(name = "requester_initials", length = 10)
    private String requesterInitials;

    @Column(name = "supporting_doc_title", length = 255)
    private String supportingDocTitle;

    @Column(name = "supporting_doc_id")
    private UUID supportingDocId;

    @Column(name = "due_date_str", length = 50)
    private String dueDateStr;

    @Column(name = "action_label", length = 100)
    private String actionLabel;

    @Column(name = "action_url", length = 255)
    private String actionUrl;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private boolean isArchived = false;

    @Column(name = "is_snoozed", nullable = false)
    @Builder.Default
    private boolean isSnoozed = false;

    @Column(name = "is_muted", nullable = false)
    @Builder.Default
    private boolean isMuted = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

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
