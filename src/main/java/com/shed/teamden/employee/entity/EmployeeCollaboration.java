package com.shed.teamden.employee.entity;

import com.shed.teamden.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "employee_collaborations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeCollaboration {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "partner_name", nullable = false, length = 150)
    private String partnerName;

    @Column(name = "partner_initials", nullable = false, length = 10)
    private String partnerInitials;

    @Column(name = "project_title", nullable = false, length = 255)
    private String projectTitle;

    @Column(name = "status_label", nullable = false, length = 150)
    private String statusLabel;

    @Column(name = "card_theme", nullable = false, length = 50)
    @Builder.Default
    private String cardTheme = "peach";

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
        if (this.cardTheme == null) {
            this.cardTheme = "peach";
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}
