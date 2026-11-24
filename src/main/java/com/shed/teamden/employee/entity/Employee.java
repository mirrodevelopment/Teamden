package com.shed.teamden.employee.entity;

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
        name = "employees",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_employees_org_email", columnNames = {"organization_id", "email"})
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employee {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "employee_id_number", length = 50)
    private String employeeIdNumber;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "initials", nullable = false, length = 10)
    private String initials;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "job_title", nullable = false, length = 150)
    private String jobTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(name = "department_name", nullable = false, length = 150)
    @Builder.Default
    private String departmentName = "Design Team";

    @Column(name = "company_name", nullable = false, length = 150)
    @Builder.Default
    private String companyName = "Workspace";

    @Column(name = "short_bio", columnDefinition = "TEXT")
    private String shortBio;

    @Column(name = "detailed_bio", columnDefinition = "TEXT")
    private String detailedBio;

    @Column(name = "card_theme", nullable = false, length = 50)
    @Builder.Default
    private String cardTheme = "lavender";

    @Column(name = "role_title", nullable = false, length = 100)
    @Builder.Default
    private String roleTitle = "Employee";

    @Column(name = "employment_type", nullable = false, length = 50)
    @Builder.Default
    private String employmentType = "Full-time";

    @Column(name = "work_location", nullable = false, length = 100)
    @Builder.Default
    private String workLocation = "London / Remote";

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporting_manager_id")
    private Employee reportingManager;

    @Column(name = "reporting_manager_name", length = 150)
    private String reportingManagerName;

    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private String status = "ACTIVE";

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
        if (this.email != null) {
            this.email = this.email.trim().toLowerCase();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
        if (this.sortOrder == null) {
            this.sortOrder = 0;
        }
        if (this.cardTheme == null) {
            this.cardTheme = "lavender";
        }
        if (this.companyName == null) {
            this.companyName = this.organization != null ? this.organization.getName() : "Workspace";
        }
        if (this.departmentName == null) {
            this.departmentName = "Design Team";
        }
        if (this.employmentType == null) {
            this.employmentType = "Full-time";
        }
        if (this.workLocation == null) {
            this.workLocation = "London / Remote";
        }
        if (this.roleTitle == null) {
            this.roleTitle = "Employee";
        }
    }
}
