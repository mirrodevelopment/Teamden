package com.shed.teamden.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsPageDataDto {
    private WorkspaceSettingDto organization;
    private List<MemberSettingDto> members;
    private List<RolePermissionDto> roles;
    private List<IntegrationSettingDto> integrations;
    private List<SecurityPolicyDto> securityPolicies;
}
