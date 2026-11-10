package com.shed.teamden.calendar.entity;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calendar_team_availability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarTeamAvailability {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "member_initials", nullable = false, length = 10)
    private String memberInitials;

    @Column(name = "member_name", nullable = false, length = 100)
    private String memberName;

    @Column(name = "member_role", length = 100)
    private String memberRole;

    @Column(name = "avatar_theme", nullable = false, length = 30)
    @Builder.Default
    private String avatarTheme = "avatar-pk";

    @Column(name = "availability_status", length = 50)
    @Builder.Default
    private String availabilityStatus = "Available";

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
