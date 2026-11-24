package com.shed.teamden.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RolePermissionDto {
    private String id;
    private String name; // "Admin", "Team Admin", "Member", "Guest"
    private String description;
    private String icon;
    private Integer memberCount;
    // Map of module -> actions, e.g. "Projects" -> {"create": true, "view": true, "edit": true, "delete": true}
    private Map<String, Map<String, Boolean>> modulePermissions;
}
