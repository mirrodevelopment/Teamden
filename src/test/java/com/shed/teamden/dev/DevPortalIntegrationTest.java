package com.shed.teamden.dev;

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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@ActiveProfiles("test")
public class DevPortalIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Test
    @DisplayName("Should successfully retrieve database tables and columns metadata")
    void testGetTables() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mockMvc.perform(get("/api/dev/tables")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Autowired
    private com.shed.teamden.user.repository.UserRepository userRepository;

    @Test
    @DisplayName("Should successfully retrieve dev users and database overview")
    void testGetUsersAndOverview() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        mockMvc.perform(get("/api/dev/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/dev/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONNECTED"));
    }

    @Test
    @DisplayName("Should test dev login-as endpoint")
    void testLoginAsUserEndpoint() throws Exception {
        MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();

        java.util.List<com.shed.teamden.user.entity.User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            java.util.UUID userId = users.get(0).getId();
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/dev/login-as/" + userId))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.authenticated").value(true));
        }
    }
}
