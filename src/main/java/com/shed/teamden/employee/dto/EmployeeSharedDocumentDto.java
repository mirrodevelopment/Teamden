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
public class EmployeeSharedDocumentDto {
    private UUID id;
    private String documentTitle;
    private String maintainedByLabel;
    private String documentUrl;
    private String cardTheme;
}
