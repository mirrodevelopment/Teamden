package com.shed.teamden.provisioning.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetupRequest {

    @NotBlank(message = "Organization name is required")
    @Size(min = 2, max = 150, message = "Organization name must be between 2 and 150 characters")
    private String organizationName;

    @NotBlank(message = "Administrator name is required")
    @Size(min = 2, max = 150, message = "Administrator name must be between 2 and 150 characters")
    private String adminName;

    @NotBlank(message = "Administrator email is required")
    @Email(message = "Valid email address is required")
    private String adminEmail;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String adminPassword;
}
