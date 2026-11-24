package com.shed.teamden.settings.controller;

import com.shed.teamden.settings.dto.*;
import com.shed.teamden.settings.service.SettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/data")
    public ResponseEntity<SettingsPageDataDto> getSettingsData() {
        return ResponseEntity.ok(settingsService.getSettingsData());
    }

    @PutMapping("/organization")
    public ResponseEntity<WorkspaceSettingDto> updateOrganization(@RequestBody UpdateOrganizationRequestDto request) {
        return ResponseEntity.ok(settingsService.updateOrganization(request));
    }

    @PostMapping("/members/invite")
    public ResponseEntity<MemberSettingDto> inviteMember(@RequestBody InviteMemberRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(settingsService.inviteMember(request));
    }

    @PutMapping("/members/{id}/role")
    public ResponseEntity<MemberSettingDto> updateMemberRole(
            @PathVariable("id") String memberId,
            @RequestBody UpdateMemberRoleRequestDto request) {
        return ResponseEntity.ok(settingsService.updateMemberRole(memberId, request));
    }

    @PutMapping("/roles/{id}/permissions")
    public ResponseEntity<RolePermissionDto> updateRolePermissions(
            @PathVariable("id") String roleCode,
            @RequestBody UpdateRolePermissionsRequestDto request) {
        return ResponseEntity.ok(settingsService.updateRolePermissions(roleCode, request));
    }

    @DeleteMapping("/members/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable("id") String memberId) {
        settingsService.removeMember(memberId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/integrations/{code}/toggle")
    public ResponseEntity<IntegrationSettingDto> toggleIntegration(@PathVariable("code") String code) {
        return ResponseEntity.ok(settingsService.toggleIntegration(code));
    }

    @PostMapping("/security/{key}/toggle")
    public ResponseEntity<SecurityPolicyDto> toggleSecurityPolicy(@PathVariable("key") String policyKey) {
        return ResponseEntity.ok(settingsService.toggleSecurityPolicy(policyKey));
    }
}
