package com.shed.teamden.provisioning;

import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

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
    private OrganizationRepository organizationRepository;

    @Test
    @DisplayName("Should successfully register a new company and create owner membership")
    void testRegisterNewCompany() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        String json = "{\"organizationName\":\"Acme Global Corp\",\"adminName\":\"Alice Founder\",\"adminEmail\":\"alice@acmeglobal.com\",\"adminPassword\":\"SuperSecret123!\"}";

        mockMvc.perform(post("/api/setup/register-company")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        assertThat(userRepository.existsByEmailIgnoreCase("alice@acmeglobal.com")).isTrue();
        assertThat(organizationRepository.findAll())
                .anyMatch(org -> "Acme Global Corp".equals(org.getName()));
    }
}
