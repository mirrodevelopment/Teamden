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
public class WorkspaceRoleDto {
    private UUID id;
    private String name;
    private String description;
    private String permissionsSummary;
    private int employeeCount;
    private boolean system;
    private int sortOrder;
}
