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
public class EmployeeTaskSummaryDto {
    private UUID id;
    private String title;
    private String projectName;
    private String status;
    private String statusLabel;
    private String statusTheme; // "blue", "peach", "green"
    private String dueDate;
    private boolean completed;
}
