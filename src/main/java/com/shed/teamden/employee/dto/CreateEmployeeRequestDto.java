package com.shed.teamden.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmployeeRequestDto {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Work email is required")
    @Email(message = "Valid email is required")
    private String email;

    private String phone;

    @NotBlank(message = "Job title is required")
    private String jobTitle;

    private String employeeIdNumber;
    private UUID departmentId;
    private String departmentName;
    private String companyName;
    private String shortBio;
    private String detailedBio;
    private String roleTitle;
    private String employmentType;
    private String workLocation;
    private LocalDate joiningDate;
    private String reportingManagerName;
    private String cardTheme;
    private List<String> responsibilities;
    private String skills;
}
