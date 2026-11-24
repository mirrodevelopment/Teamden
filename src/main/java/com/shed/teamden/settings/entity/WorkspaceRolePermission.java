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
        name = "workspace_role_permissions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_org_role_module", columnNames = {"organization_id", "role_code", "module_name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceRolePermission {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "role_code", nullable = false, length = 50)
    private String roleCode;

    @Column(name = "role_name", nullable = false, length = 100)
    private String roleName;

    @Column(name = "role_description", columnDefinition = "TEXT")
    private String roleDescription;

    @Column(name = "role_icon", nullable = false, length = 50)
    @Builder.Default
    private String roleIcon = "shield";

    @Column(name = "module_name", nullable = false, length = 50)
    private String moduleName;

    @Column(name = "can_view", nullable = false)
    @Builder.Default
    private boolean canView = true;

    @Column(name = "can_create", nullable = false)
    @Builder.Default
    private boolean canCreate = false;

    @Column(name = "can_edit", nullable = false)
    @Builder.Default
    private boolean canEdit = false;

    @Column(name = "can_delete", nullable = false)
    @Builder.Default
    private boolean canDelete = false;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

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
        if (this.roleIcon == null) {
            this.roleIcon = "shield";
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}
