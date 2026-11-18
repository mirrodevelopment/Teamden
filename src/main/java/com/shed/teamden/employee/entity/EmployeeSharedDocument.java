package com.shed.teamden.employee.entity;

import com.shed.teamden.organization.entity.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "employee_shared_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeSharedDocument {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "document_title", nullable = false, length = 255)
    private String documentTitle;

    @Column(name = "maintained_by_label", nullable = false, length = 255)
    private String maintainedByLabel;

    @Column(name = "document_url", nullable = false, length = 255)
    @Builder.Default
    private String documentUrl = "/pages/workspace/workspace.html";

    @Column(name = "card_theme", nullable = false, length = 50)
    @Builder.Default
    private String cardTheme = "green";

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
            this.cardTheme = "green";
        }
        if (this.documentUrl == null) {
            this.documentUrl = "/pages/workspace/workspace.html";
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}
