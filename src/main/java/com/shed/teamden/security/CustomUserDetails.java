package com.shed.teamden.security;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.user.entity.UserStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

public class CustomUserDetails implements UserDetails {

    private final UUID id;
    private final String fullName;
    private final String email;
    private final String passwordHash;
    private final UserStatus status;
    private final UUID activeOrganizationId;
    private final String activeOrganizationName;
    private final MembershipRole activeRole;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(
            UUID id,
            String fullName,
            String email,
            String passwordHash,
            UserStatus status,
            UUID activeOrganizationId,
            String activeOrganizationName,
            MembershipRole activeRole,
            Collection<? extends GrantedAuthority> authorities
    ) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.status = status;
        this.activeOrganizationId = activeOrganizationId;
        this.activeOrganizationName = activeOrganizationName;
        this.activeRole = activeRole;
        this.authorities = authorities;
    }

    public static CustomUserDetails create(
            UUID id,
            String fullName,
            String email,
            String passwordHash,
            UserStatus status,
            UUID activeOrgId,
            String activeOrgName,
            MembershipRole activeRole
    ) {
        String roleAuthority = activeRole != null ? "ROLE_" + activeRole.name() : "ROLE_MEMBER";
        return CustomUserDetails.builder()
                .id(id)
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordHash)
                .status(status)
                .activeOrganizationId(activeOrgId)
                .activeOrganizationName(activeOrgName)
                .activeRole(activeRole)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority(roleAuthority)))
                .build();
    }

    public static CustomUserDetailsBuilder builder() {
        return new CustomUserDetailsBuilder();
    }

    public UUID getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserStatus getStatus() {
        return status;
    }

    public UUID getActiveOrganizationId() {
        return activeOrganizationId;
    }

    public String getActiveOrganizationName() {
        return activeOrganizationName;
    }

    public MembershipRole getActiveRole() {
        return activeRole;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return status != UserStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return status == UserStatus.ACTIVE;
    }

    public static class CustomUserDetailsBuilder {
        private UUID id;
        private String fullName;
        private String email;
        private String passwordHash;
        private UserStatus status;
        private UUID activeOrganizationId;
        private String activeOrganizationName;
        private MembershipRole activeRole;
        private Collection<? extends GrantedAuthority> authorities;

        public CustomUserDetailsBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public CustomUserDetailsBuilder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public CustomUserDetailsBuilder email(String email) {
            this.email = email;
            return this;
        }

        public CustomUserDetailsBuilder passwordHash(String passwordHash) {
            this.passwordHash = passwordHash;
            return this;
        }

        public CustomUserDetailsBuilder status(UserStatus status) {
            this.status = status;
            return this;
        }

        public CustomUserDetailsBuilder activeOrganizationId(UUID activeOrganizationId) {
            this.activeOrganizationId = activeOrganizationId;
            return this;
        }

        public CustomUserDetailsBuilder activeOrganizationName(String activeOrganizationName) {
            this.activeOrganizationName = activeOrganizationName;
            return this;
        }

        public CustomUserDetailsBuilder activeRole(MembershipRole activeRole) {
            this.activeRole = activeRole;
            return this;
        }

        public CustomUserDetailsBuilder authorities(Collection<? extends GrantedAuthority> authorities) {
            this.authorities = authorities;
            return this;
        }

        public CustomUserDetails build() {
            return new CustomUserDetails(
                    id,
                    fullName,
                    email,
                    passwordHash,
                    status,
                    activeOrganizationId,
                    activeOrganizationName,
                    activeRole,
                    authorities
            );
        }
    }
}
