package com.shed.teamden.auth;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class AuthenticationIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private OrganizationMembershipRepository membershipRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private User disabledUser;
    private Organization testOrg;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        membershipRepository.deleteAll();
        userRepository.deleteAll();
        organizationRepository.deleteAll();

        // Create organization
        testOrg = organizationRepository.save(Organization.builder()
                .name("Acme Services")
                .status(OrganizationStatus.ACTIVE)
                .build());

        // Create active user with BCrypt hashed password
        testUser = userRepository.save(User.builder()
                .fullName("Alex Morgan")
                .email("alex@acme.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.ACTIVE)
                .build());

        // Create membership
        membershipRepository.save(OrganizationMembership.builder()
                .organization(testOrg)
                .user(testUser)
                .role(MembershipRole.OWNER)
                .status(MembershipStatus.ACTIVE)
                .build());

        // Create disabled user
        disabledUser = userRepository.save(User.builder()
                .fullName("Disabled User")
                .email("disabled@acme.com")
                .passwordHash(passwordEncoder.encode("SecurePass123!"))
                .status(UserStatus.SUSPENDED)
                .build());

        membershipRepository.save(OrganizationMembership.builder()
                .organization(testOrg)
                .user(disabledUser)
                .role(MembershipRole.MEMBER)
                .status(MembershipStatus.SUSPENDED)
                .build());
    }

    @Test
    @DisplayName("Valid credentials should authenticate, establish session, and never expose password hash")
    void testValidLogin() throws Exception {
        String json = "{\"email\":\"alex@acme.com\",\"password\":\"SecurePass123!\"}";

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value("alex@acme.com"))
                .andExpect(jsonPath("$.data.user.fullName").value("Alex Morgan"))
                .andExpect(jsonPath("$.data.user.activeOrganizationName").value("Acme Services"))
                .andExpect(jsonPath("$.data.user.role").value("OWNER"))
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertThat(session).isNotNull();

        // Verify /api/auth/me works with this session
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("alex@acme.com"))
                .andExpect(jsonPath("$.data.activeOrganizationName").value("Acme Services"));
    }

    @Test
    @DisplayName("Invalid password should return 401 Unauthorized")
    void testInvalidPasswordLogin() throws Exception {
        String json = "{\"email\":\"alex@acme.com\",\"password\":\"WrongPassword!\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("Suspended or disabled account should be rejected")
    void testDisabledAccountLogin() throws Exception {
        String json = "{\"email\":\"disabled@acme.com\",\"password\":\"SecurePass123!\"}";

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Unauthenticated request to protected endpoint should return 401")
    void testUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Logout should invalidate session when valid CSRF token is present")
    void testLogout() throws Exception {
        // First login
        String json = "{\"email\":\"alex@acme.com\",\"password\":\"SecurePass123!\"}";

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);
        assertThat(session).isNotNull();

        // Logout with CSRF token
        mockMvc.perform(post("/api/auth/logout").with(csrf()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Attempting to access protected endpoint with old session should fail
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("State-changing requests without CSRF token must be rejected with 403 Forbidden")
    void testCsrfProtectionEnforcedOnLogout() throws Exception {
        String json = "{\"email\":\"alex@acme.com\",\"password\":\"SecurePass123!\"}";

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession(false);

        // Attempt logout without CSRF token -> should be rejected with 403
        mockMvc.perform(post("/api/auth/logout").session(session))
                .andExpect(status().isForbidden());
    }
}
