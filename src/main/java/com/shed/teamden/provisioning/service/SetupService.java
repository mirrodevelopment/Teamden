package com.shed.teamden.provisioning.service;

import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.service.ActivityService;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ConflictException;
import com.shed.teamden.organization.entity.*;
import com.shed.teamden.organization.repository.LegalAcceptanceRepository;
import com.shed.teamden.organization.repository.OrganizationAddressRepository;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.provisioning.dto.CompleteRegistrationRequestDto;
import com.shed.teamden.provisioning.dto.SetupRequest;
import com.shed.teamden.provisioning.dto.SetupStatusResponse;
import com.shed.teamden.provisioning.entity.EmailVerification;
import com.shed.teamden.provisioning.repository.EmailVerificationRepository;
import com.shed.teamden.settings.entity.WorkspaceSetting;
import com.shed.teamden.settings.repository.WorkspaceSettingRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserProfile;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserProfileRepository;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SetupService implements CommandLineRunner {

    private final OrganizationRepository organizationRepository;
    private final OrganizationAddressRepository organizationAddressRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final OrganizationMembershipRepository membershipRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final LegalAcceptanceRepository legalAcceptanceRepository;
    private final WorkspaceSettingRepository workspaceSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityService activityService;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

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
    public Map<String, String> sendVerificationCode(String rawEmail) {
        if (rawEmail == null || rawEmail.trim().isEmpty()) {
            throw new BadRequestException("Work email is required");
        }
        String normalizedEmail = rawEmail.trim().toLowerCase();

        String code = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES);

        EmailVerification verification = EmailVerification.builder()
                .email(normalizedEmail)
                .verificationCode(code)
                .isVerified(false)
                .expiresAt(expiresAt)
                .build();

        emailVerificationRepository.save(verification);
        log.info("[OTP VERIFICATION] Generated 6-digit code for {}: {}", normalizedEmail, code);

        return Map.of(
                "email", normalizedEmail,
                "code", code,
                "message", "Verification code sent to " + normalizedEmail
        );
    }

    @Transactional
    public boolean verifyCode(String rawEmail, String rawCode) {
        if (rawEmail == null || rawCode == null) {
            throw new BadRequestException("Email and verification code are required");
        }
        String normalizedEmail = rawEmail.trim().toLowerCase();
        String code = rawCode.trim();

        EmailVerification verification = emailVerificationRepository
                .findTopByEmailAndVerificationCodeOrderByCreatedAtDesc(normalizedEmail, code)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification code"));

        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Verification code has expired. Please request a new code.");
        }

        verification.setIsVerified(true);
        verification.setVerifiedAt(Instant.now());
        emailVerificationRepository.save(verification);
        log.info("[OTP VERIFICATION] Successfully verified email {}", normalizedEmail);

        return true;
    }

    @Transactional
    public void provisionInitialWorkspace(SetupRequest request) {
        registerNewCompany(request);
    }

    @Transactional
    public void registerNewCompany(SetupRequest request) {
        CompleteRegistrationRequestDto dto = CompleteRegistrationRequestDto.builder()
                .organizationName(request.getOrganizationName())
                .adminName(request.getAdminName())
                .adminEmail(request.getAdminEmail())
                .adminPassword(request.getAdminPassword())
                .build();
        registerCompany(dto);
    }

    @Transactional
    public void registerCompany(CompleteRegistrationRequestDto request) {
        String normalizedEmail = request.getAdminEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("An account with email '" + normalizedEmail + "' already exists. Please sign in or use another work email.");
        }

        // 1. Create Organization (Step 1)
        Organization organization = Organization.builder()
                .name(request.getOrganizationName().trim())
                .legalName(request.getLegalName() != null && !request.getLegalName().isBlank() ? request.getLegalName().trim() : request.getOrganizationName().trim())
                .companyType(request.getCompanyType() != null ? request.getCompanyType() : "Private Limited Company")
                .industry(request.getIndustry() != null ? request.getIndustry() : "IT & Software")
                .industryOther(request.getIndustryOther())
                .companySize(request.getCompanySize() != null ? request.getCompanySize() : "1–5 employees")
                .websiteUrl(request.getWebsiteUrl())
                .yearEstablished(request.getYearEstablished())
                .logoUrl(request.getCompanyLogo())
                .status(OrganizationStatus.ACTIVE)
                .build();
        organization = organizationRepository.save(organization);

        // 2. Create Organization Address (Step 2)
        boolean sameBilling = request.getBillingSameAsRegistered() == null || request.getBillingSameAsRegistered();
        OrganizationAddress address = OrganizationAddress.builder()
                .organization(organization)
                .country(request.getCountry() != null ? request.getCountry() : "United States")
                .registeredAddress(request.getRegisteredAddress() != null ? request.getRegisteredAddress() : "100 Innovation Way")
                .addressLine2(request.getAddressLine2())
                .city(request.getCity() != null ? request.getCity() : "San Francisco")
                .state(request.getState())
                .postalCode(request.getPostalCode())
                .businessRegNumber(request.getBusinessRegNumber())
                .taxId(request.getTaxId())
                .billingSameAsRegistered(sameBilling)
                .billingAddress(sameBilling ? request.getRegisteredAddress() : request.getBillingAddress())
                .billingAddressLine2(sameBilling ? request.getAddressLine2() : request.getBillingAddressLine2())
                .billingCity(sameBilling ? request.getCity() : request.getBillingCity())
                .billingState(sameBilling ? request.getState() : request.getBillingState())
                .billingPostalCode(sameBilling ? request.getPostalCode() : request.getBillingPostalCode())
                .billingCountry(sameBilling ? request.getCountry() : request.getBillingCountry())
                .build();
        organizationAddressRepository.save(address);

        // 3. Create Administrator User (Step 3)
        User adminUser = User.builder()
                .fullName(request.getAdminName().trim())
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(request.getAdminPassword()))
                .status(UserStatus.ACTIVE)
                .build();
        adminUser = userRepository.save(adminUser);

        // 4. Create User Profile
        UserProfile userProfile = UserProfile.builder()
                .user(adminUser)
                .jobTitle(request.getJobTitle())
                .phoneNumber(request.getPhoneNumber())
                .avatarUrl(request.getProfilePicture())
                .build();
        userProfileRepository.save(userProfile);

        // 5. Create Owner Membership (No role selector allowed - first admin is Owner)
        OrganizationMembership membership = OrganizationMembership.builder()
                .organization(organization)
                .user(adminUser)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build();
        membershipRepository.save(membership);

        // 6. Create Workspace Setting (Timezone & Currency defaults)
        String tz = (request.getTimezone() != null && !request.getTimezone().isBlank()) ? request.getTimezone() : "UTC";
        WorkspaceSetting workspaceSetting = WorkspaceSetting.builder()
                .organization(organization)
                .workspaceName(organization.getName())
                .workspaceType("Organisation workspace")
                .workspaceUrl(organization.getName().toLowerCase().replaceAll("[^a-z0-9]", "") + ".teamden.app")
                .logoInitials(organization.getName().substring(0, Math.min(2, organization.getName().length())).toUpperCase())
                .timezone(tz)
                .language("English")
                .weekStartsOn("Monday")
                .build();
        workspaceSettingRepository.save(workspaceSetting);

        // 7. Create Legal Acceptance Record
        LegalAcceptance legalAcceptance = LegalAcceptance.builder()
                .user(adminUser)
                .organization(organization)
                .termsAccepted(request.getTermsAccepted() == null || request.getTermsAccepted())
                .privacyAccepted(request.getPrivacyAccepted() == null || request.getPrivacyAccepted())
                .authorizedToRegister(request.getAuthorizedToRegister() == null || request.getAuthorizedToRegister())
                .termsVersion("v1.0")
                .privacyVersion("v1.0")
                .build();
        legalAcceptanceRepository.save(legalAcceptance);

        // 8. Record Activity Event
        activityService.recordEvent(
                organization,
                adminUser,
                ActivityEventType.WORKSPACE_PROVISIONED,
                "ORGANIZATION",
                organization.getId(),
                "Company Registered",
                "New company workspace '" + organization.getName() + "' registered with Owner " + adminUser.getFullName()
        );

        log.info("Complete organization '{}' registered with Owner '{}' successfully.",
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
