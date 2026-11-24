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
public class UpdateRolePermissionsRequestDto {
    private String description;
    private Map<String, Map<String, Boolean>> modulePermissions;
}
