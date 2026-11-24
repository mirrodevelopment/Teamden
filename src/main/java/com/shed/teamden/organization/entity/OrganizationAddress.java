package com.shed.teamden.organization.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "organization_addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationAddress {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "country", nullable = false, length = 100)
    private String country;

    @Column(name = "registered_address", nullable = false, length = 255)
    private String registeredAddress;

    @Column(name = "address_line2", length = 255)
    private String addressLine2;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "postal_code", length = 30)
    private String postalCode;

    @Column(name = "business_reg_number", length = 100)
    private String businessRegNumber;

    @Column(name = "tax_id", length = 100)
    private String taxId;

    @Column(name = "billing_same_as_registered", nullable = false)
    @Builder.Default
    private Boolean billingSameAsRegistered = true;

    @Column(name = "billing_address", length = 255)
    private String billingAddress;

    @Column(name = "billing_address_line2", length = 255)
    private String billingAddressLine2;

    @Column(name = "billing_city", length = 100)
    private String billingCity;

    @Column(name = "billing_state", length = 100)
    private String billingState;

    @Column(name = "billing_postal_code", length = 30)
    private String billingPostalCode;

    @Column(name = "billing_country", length = 100)
    private String billingCountry;

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
        if (this.billingSameAsRegistered == null) {
            this.billingSameAsRegistered = true;
        }
    }
}
