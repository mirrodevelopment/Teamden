package com.shed.teamden.employee.entity;

import com.shed.teamden.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "workspace_roles",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_workspace_roles_org_name", columnNames = {"organization_id", "name"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkspaceRole {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "permissions_summary", length = 255)
    private String permissionsSummary;

    @Column(name = "employee_count", nullable = false)
    @Builder.Default
    private Integer employeeCount = 0;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private boolean system = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.employeeCount == null) {
            this.employeeCount = 0;
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}
