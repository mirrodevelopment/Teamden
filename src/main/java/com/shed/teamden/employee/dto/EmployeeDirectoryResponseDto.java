package com.shed.teamden.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDirectoryResponseDto {
    private List<EmployeeDto> employees;
    private EmployeeDetailDto activeEmployee;
    private List<DepartmentDto> departments;
    private List<WorkspaceRoleDto> roles;
    private TeamStructureNodeDto teamStructure;
    private int peopleCount;
    private int rolesCount;
    private String selectedDepartmentName;
    private String selectedDepartmentSubtitle;
}
