package com.shed.teamden.organization.entity;

import com.shed.teamden.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "legal_acceptances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LegalAcceptance {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "terms_accepted", nullable = false)
    @Builder.Default
    private Boolean termsAccepted = true;

    @Column(name = "privacy_accepted", nullable = false)
    @Builder.Default
    private Boolean privacyAccepted = true;

    @Column(name = "authorized_to_register", nullable = false)
    @Builder.Default
    private Boolean authorizedToRegister = true;

    @Column(name = "terms_version", nullable = false, length = 50)
    @Builder.Default
    private String termsVersion = "v1.0";

    @Column(name = "privacy_version", nullable = false, length = 50)
    @Builder.Default
    private String privacyVersion = "v1.0";

    @CreationTimestamp
    @Column(name = "accepted_at", nullable = false, updatable = false)
    private Instant acceptedAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
        if (this.termsAccepted == null) this.termsAccepted = true;
        if (this.privacyAccepted == null) this.privacyAccepted = true;
        if (this.authorizedToRegister == null) this.authorizedToRegister = true;
        if (this.termsVersion == null) this.termsVersion = "v1.0";
        if (this.privacyVersion == null) this.privacyVersion = "v1.0";
    }
}
