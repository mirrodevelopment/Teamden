package com.shed.teamden.security;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final OrganizationMembershipRepository membershipRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.isBlank()) {
            throw new UsernameNotFoundException("Email cannot be empty");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UsernameNotFoundException("No account found with email: " + normalizedEmail));

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Attempt to authenticate inactive/suspended account: {}", normalizedEmail);
            throw new UsernameNotFoundException("User account is not active");
        }

        List<OrganizationMembership> activeMemberships = membershipRepository
                .findActiveMembershipsByUserId(user.getId(), MembershipStatus.ACTIVE);

        UUID activeOrgId = null;
        String activeOrgName = null;
        MembershipRole activeRole = MembershipRole.MEMBER;

        if (!activeMemberships.isEmpty()) {
            OrganizationMembership primary = activeMemberships.get(0);
            activeOrgId = primary.getOrganization().getId();
            activeOrgName = primary.getOrganization().getName();
            activeRole = primary.getRole();
        }

        return CustomUserDetails.create(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus(),
                activeOrgId,
                activeOrgName,
                activeRole
        );
    }
}
