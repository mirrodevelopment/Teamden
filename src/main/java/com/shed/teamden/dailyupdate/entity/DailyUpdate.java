package com.shed.teamden.dailyupdate.entity;

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
@Table(
        name = "daily_updates",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_daily_update_org_user_date", columnNames = {"organization_id", "user_id", "update_date"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyUpdate {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "update_date", nullable = false)
    private LocalDate updateDate;

    @Column(name = "work_completed", nullable = false, columnDefinition = "TEXT")
    private String workCompleted;

    @Column(name = "work_planned", columnDefinition = "TEXT")
    private String workPlanned;

    @Column(name = "blockers", columnDefinition = "TEXT")
    private String blockers;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DailyUpdateStatus status = DailyUpdateStatus.SUBMITTED;

    @Enumerated(EnumType.STRING)
    @Column(name = "mood_tag", length = 30)
    @Builder.Default
    private DailyUpdateMood moodTag = DailyUpdateMood.ON_TRACK;

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
            this.status = DailyUpdateStatus.SUBMITTED;
        }
        if (this.moodTag == null) {
            this.moodTag = DailyUpdateMood.ON_TRACK;
        }
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
        if (this.updatedAt == null) {
            this.updatedAt = Instant.now();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
