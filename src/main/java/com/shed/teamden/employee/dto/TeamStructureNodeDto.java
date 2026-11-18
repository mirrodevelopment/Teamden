package com.shed.teamden.employee.dto;

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
public class TeamStructureNodeDto {
    private String nodeType; // "COMPANY", "DEPARTMENT", "MANAGER", "EMPLOYEE"
    private UUID id;
    private String name;
    private String title;
    private String initials;
    private String theme;
    private int count;
    private List<TeamStructureNodeDto> children;
}
