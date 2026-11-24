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
public class CompleteRegistrationRequestDto {

    // Step 1: Company Details
    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 150, message = "Company name must be between 2 and 150 characters")
    private String organizationName;

    private String legalName;
    private String companyLogo;
    private String companyType;
    private String industry;
    private String industryOther;
    private String companySize;
    private String websiteUrl;
    private Integer yearEstablished;

    // Step 2: Address & Regional / Legal
    private String country;
    private String registeredAddress;
    private String addressLine2;
    private String city;
    private String state;
    private String postalCode;
    private String currency;
    private String timezone;
    private String businessRegNumber;
    private String taxId;

    @Builder.Default
    private Boolean billingSameAsRegistered = true;

    private String billingAddress;
    private String billingAddressLine2;
    private String billingCity;
    private String billingState;
    private String billingPostalCode;
    private String billingCountry;

    // Step 3: Administrator Account
    @NotBlank(message = "Administrator name is required")
    @Size(min = 2, max = 150, message = "Administrator name must be between 2 and 150 characters")
    private String adminName;

    @NotBlank(message = "Administrator email is required")
    @Email(message = "Valid email address is required")
    private String adminEmail;

    private String verificationCode;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String adminPassword;

    private String jobTitle;
    private String phoneNumber;
    private String profilePicture;

    @Builder.Default
    private Boolean termsAccepted = true;

    @Builder.Default
    private Boolean privacyAccepted = true;

    @Builder.Default
    private Boolean authorizedToRegister = true;
}
