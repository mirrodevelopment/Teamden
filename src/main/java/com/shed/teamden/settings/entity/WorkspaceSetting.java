package com.shed.teamden.settings.entity;

import com.shed.teamden.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "workspace_settings",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_workspace_settings_org", columnNames = {"organization_id"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceSetting {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "workspace_name", nullable = false, length = 150)
    @Builder.Default
    private String workspaceName = "Workspace";

    @Column(name = "workspace_type", nullable = false, length = 100)
    @Builder.Default
    private String workspaceType = "Organisation workspace";

    @Column(name = "workspace_url", nullable = false, length = 255)
    @Builder.Default
    private String workspaceUrl = "workspace.teamden.app";

    @Column(name = "logo_initials", nullable = false, length = 10)
    @Builder.Default
    private String logoInitials = "AC";

    @Column(name = "timezone", nullable = false, length = 100)
    @Builder.Default
    private String timezone = "Asia/Kolkata (GMT+5:30)";

    @Column(name = "language", nullable = false, length = 50)
    @Builder.Default
    private String language = "English";

    @Column(name = "week_starts_on", nullable = false, length = 50)
    @Builder.Default
    private String weekStartsOn = "Monday";

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
    }
}
