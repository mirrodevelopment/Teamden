package com.shed.teamden.employee.dto;

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
public class EmployeeDto {
    private UUID id;
    private String employeeIdNumber;
    private String fullName;
    private String initials;
    private String email;
    private String phone;
    private String jobTitle;
    private UUID departmentId;
    private String departmentName;
    private String companyName;
    private String shortBio;
    private String detailedBio;
    private String cardTheme;
    private String roleTitle;
    private String employmentType;
    private String workLocation;
    private LocalDate joiningDate;
    private String reportingManagerName;
    private String status;
    private int responsibilitiesCount;
    private List<EmployeeResponsibilityDto> responsibilities;
}
