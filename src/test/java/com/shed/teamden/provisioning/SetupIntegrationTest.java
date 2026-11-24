package com.shed.teamden.provisioning;

import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.LegalAcceptanceRepository;
import com.shed.teamden.organization.repository.OrganizationAddressRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.provisioning.repository.EmailVerificationRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserProfileRepository;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class SetupIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository userProfileRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationAddressRepository organizationAddressRepository;

    @Autowired
    private LegalAcceptanceRepository legalAcceptanceRepository;

    @Autowired
    private EmailVerificationRepository emailVerificationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    @AfterEach
    void cleanUp() {
        jdbcTemplate.execute("DELETE FROM legal_acceptances");
        jdbcTemplate.execute("DELETE FROM user_profiles");
        jdbcTemplate.execute("DELETE FROM organization_addresses");
        jdbcTemplate.execute("DELETE FROM email_verifications");
        jdbcTemplate.execute("DELETE FROM activity_events WHERE actor_id IN (SELECT id FROM users WHERE email IN ('alice@acmeglobal.com', 'tony@stark.com', 'verify-test@brick.com'))");
        jdbcTemplate.execute("DELETE FROM workspace_settings WHERE organization_id IN (SELECT id FROM organizations WHERE name IN ('Acme Global Corp', 'Stark Industries'))");
        jdbcTemplate.execute("DELETE FROM organization_memberships WHERE user_id IN (SELECT id FROM users WHERE email IN ('alice@acmeglobal.com', 'tony@stark.com', 'verify-test@brick.com'))");
        jdbcTemplate.execute("DELETE FROM users WHERE email IN ('alice@acmeglobal.com', 'tony@stark.com', 'verify-test@brick.com')");
        jdbcTemplate.execute("DELETE FROM organizations WHERE name IN ('Acme Global Corp', 'Stark Industries')");
    }

    @Test
    @DisplayName("Should successfully register a new company with minimal payload (backward compatibility)")
    void testRegisterNewCompany() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String json = "{\"organizationName\":\"Acme Global Corp\",\"adminName\":\"Alice Founder\",\"adminEmail\":\"alice@acmeglobal.com\",\"adminPassword\":\"SuperSecret123!\"}";

        mockMvc.perform(post("/api/setup/register-company")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(userRepository.existsByEmailIgnoreCase("alice@acmeglobal.com")).isTrue();
        assertThat(organizationRepository.findAll())
                .anyMatch(org -> "Acme Global Corp".equals(org.getName()));
    }

    @Test
    @DisplayName("Should handle OTP verification code request and verification")
    void testVerificationCodeFlow() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String email = "verify-test@brick.com";
        String requestJson = "{\"email\":\"" + email + "\"}";

        MvcResult result = mockMvc.perform(post("/api/setup/send-verification-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(result.getResponse().getContentAsString());
        String code = root.path("data").path("code").asText();
        assertThat(code).isNotEmpty();
        assertThat(code).hasSize(6);

        // Now verify code
        String verifyJson = "{\"email\":\"" + email + "\",\"code\":\"" + code + "\"}";
        mockMvc.perform(post("/api/setup/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").value(true));

        assertThat(emailVerificationRepository.findTopByEmailOrderByCreatedAtDesc(email))
                .isPresent()
                .hasValueSatisfying(v -> assertThat(v.getIsVerified()).isTrue());
    }

    @Test
    @DisplayName("Should register complete 4-step BRICK organization with all tables populated")
    void testCompleteBrickRegistration() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String payload = """
                {
                  "organizationName": "Stark Industries",
                  "legalName": "Stark Industries Global LLC",
                  "companyType": "Corporation",
                  "industry": "Manufacturing",
                  "companySize": "500+ employees",
                  "websiteUrl": "https://starkindustries.com",
                  "yearEstablished": 1940,
                  "country": "United States",
                  "registeredAddress": "10880 Wilshire Blvd",
                  "addressLine2": "Suite 100",
                  "city": "Los Angeles",
                  "state": "California",
                  "postalCode": "90024",
                  "currency": "USD",
                  "timezone": "America/Los_Angeles",
                  "businessRegNumber": "CA-STARK-001",
                  "taxId": "US-95-1234567",
                  "billingSameAsRegistered": true,
                  "adminName": "Tony Stark",
                  "adminEmail": "tony@stark.com",
                  "adminPassword": "ArcReactor2026!",
                  "jobTitle": "Chief Executive Officer",
                  "phoneNumber": "+1 (310) 555-0199",
                  "termsAccepted": true,
                  "privacyAccepted": true,
                  "authorizedToRegister": true
                }
                """;

        mockMvc.perform(post("/api/setup/register-company")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase("tony@stark.com");
        assertThat(userOpt).isPresent();
        User user = userOpt.get();

        // Verify User Profile
        assertThat(userProfileRepository.findByUserId(user.getId()))
                .isPresent()
                .hasValueSatisfying(profile -> {
                    assertThat(profile.getJobTitle()).isEqualTo("Chief Executive Officer");
                    assertThat(profile.getPhoneNumber()).isEqualTo("+1 (310) 555-0199");
                });

        // Verify Organization Details
        Optional<Organization> orgOpt = organizationRepository.findByName("Stark Industries");
        assertThat(orgOpt).isPresent();
        Organization org = orgOpt.get();
        assertThat(org.getLegalName()).isEqualTo("Stark Industries Global LLC");
        assertThat(org.getCompanyType()).isEqualTo("Corporation");
        assertThat(org.getIndustry()).isEqualTo("Manufacturing");
        assertThat(org.getCompanySize()).isEqualTo("500+ employees");
        assertThat(org.getWebsiteUrl()).isEqualTo("https://starkindustries.com");
        assertThat(org.getYearEstablished()).isEqualTo(1940);

        // Verify Organization Address
        assertThat(organizationAddressRepository.findByOrganizationId(org.getId()))
                .isPresent()
                .hasValueSatisfying(address -> {
                    assertThat(address.getCountry()).isEqualTo("United States");
                    assertThat(address.getRegisteredAddress()).isEqualTo("10880 Wilshire Blvd");
                    assertThat(address.getCity()).isEqualTo("Los Angeles");
                    assertThat(address.getState()).isEqualTo("California");
                    assertThat(address.getPostalCode()).isEqualTo("90024");
                    assertThat(address.getBusinessRegNumber()).isEqualTo("CA-STARK-001");
                    assertThat(address.getTaxId()).isEqualTo("US-95-1234567");
                });

        // Verify Legal Acceptance
        assertThat(legalAcceptanceRepository.findByOrganizationId(org.getId()))
                .isNotEmpty()
                .anyMatch(legal -> legal.getTermsAccepted() && legal.getPrivacyAccepted() && legal.getAuthorizedToRegister());
    }
}
