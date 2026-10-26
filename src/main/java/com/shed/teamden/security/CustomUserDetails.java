package com.shed.teamden.security;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.user.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.UUID;

@Getter
@Builder
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
}
