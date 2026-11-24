package com.shed.teamden.team.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamOptionsDto {

    private List<DepartmentOptionDto> departments;
    private List<EmployeeOptionDto> employees;
    private List<String> categories;
    private List<String> visibilityOptions;
    private List<String> defaultPermissions;
    private List<String> memberRoles;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentOptionDto {
        private UUID id;
        private String name;
        private String subtitle;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeOptionDto {
        private UUID id;
        private String name;
        private String initials;
        private String jobTitle;
        private String departmentName;
        private String email;
        private String cardTheme;
        private String status;
    }
}
