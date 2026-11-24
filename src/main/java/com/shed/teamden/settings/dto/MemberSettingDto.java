package com.shed.teamden.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberSettingDto {
    private String id;
    private String fullName;
    private String email;
    private String jobTitle;
    private String role; // "Organisation Admin", "Member", "Team Admin", "Guest"
    private String initials;
    private String theme;
    private boolean isOwner;
}
