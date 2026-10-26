package com.shed.teamden.provisioning.service;

import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.service.ActivityService;
import com.shed.teamden.common.exception.ConflictException;
import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.provisioning.dto.SetupRequest;
import com.shed.teamden.provisioning.dto.SetupStatusResponse;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SetupService implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityService activityService;

    @Value("${SETUP_ORG_NAME:}")
    private String envOrgName;

    @Value("${SETUP_ADMIN_NAME:}")
    private String envAdminName;

    @Value("${SETUP_ADMIN_EMAIL:}")
    private String envAdminEmail;

    @Value("${SETUP_ADMIN_PASSWORD:}")
    private String envAdminPassword;

    public SetupStatusResponse getSetupStatus() {
        long userCount = userRepository.count();
        long orgCount = organizationRepository.count();
        return SetupStatusResponse.builder()
                .provisioned(userCount > 0)
                .userCount(userCount)
                .organizationCount(orgCount)
                .build();
    }

    public boolean isProvisioned() {
        return userRepository.count() > 0;
    }

    @Transactional
    public void provisionInitialWorkspace(SetupRequest request) {
        if (isProvisioned()) {
            throw new ConflictException("The workspace has already been provisioned. Initial setup is locked.");
        }

        String normalizedEmail = request.getAdminEmail().trim().toLowerCase();

        // 1. Create Organization
        Organization organization = Organization.builder()
                .name(request.getOrganizationName().trim())
                .status(OrganizationStatus.ACTIVE)
                .build();
        organization = organizationRepository.save(organization);

        // 2. Create Administrator User with Hashed Password
        User adminUser = User.builder()
                .fullName(request.getAdminName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .status(UserStatus.ACTIVE)
                .build();
        adminUser = userRepository.save(adminUser);

        // 3. Create Owner Membership
        OrganizationMembership membership = OrganizationMembership.builder()
                .organization(organization)
                .user(adminUser)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build();
        membershipRepository.save(membership);

        // 4. Record Activity Event
        activityService.recordEvent(
                organization,
                adminUser,
                ActivityEventType.WORKSPACE_PROVISIONED,
                "ORGANIZATION",
                organization.getId(),
                "Workspace Initialized",
                "Initial workspace and Owner account created for " + adminUser.getFullName()
        );

        log.info("Initial workspace '{}' and Owner user '{}' provisioned successfully.",
                organization.getName(), normalizedEmail);
    }

    @Override
    public void run(String... args) {
        // Controlled provisioning via environment variables at startup if configured and DB has 0 users
        if (!isProvisioned() && envAdminEmail != null && !envAdminEmail.isBlank() && envAdminPassword != null && !envAdminPassword.isBlank()) {
            log.info("Discovered initial setup environment variables. Provisioning initial administrator...");
            String orgName = (envOrgName != null && !envOrgName.isBlank()) ? envOrgName : "Teamden Workspace";
            String adminName = (envAdminName != null && !envAdminName.isBlank()) ? envAdminName : "Workspace Owner";
            SetupRequest autoSetup = SetupRequest.builder()
                    .organizationName(orgName)
                    .adminName(adminName)
                    .adminEmail(envAdminEmail)
                    .adminPassword(envAdminPassword)
                    .build();
            provisionInitialWorkspace(autoSetup);
        }
    }
}
