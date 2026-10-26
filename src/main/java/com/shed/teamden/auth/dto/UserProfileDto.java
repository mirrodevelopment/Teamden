package com.shed.teamden.auth.dto;

import com.shed.teamden.organization.entity.MembershipRole;
import com.shed.teamden.user.entity.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {
    private UUID id;
    private String fullName;
    private String email;
    private UserStatus status;
    private UUID activeOrganizationId;
    private String activeOrganizationName;
    private MembershipRole role;
    private String initials;

    public static String computeInitials(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "TD";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
