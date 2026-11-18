package com.shed.teamden.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCollaborationDto {
    private UUID id;
    private String partnerName;
    private String partnerInitials;
    private String projectTitle;
    private String statusLabel;
    private String cardTheme;
}
