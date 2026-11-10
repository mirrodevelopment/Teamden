package com.shed.teamden.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberAvailabilityDto {
    private String id;
    private String initials;
    private String name;
    private String role;
    private String theme;
    private String status;
}
