package com.shed.teamden.team.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberDto {

    private UUID id;
    private UUID employeeId;
    private String fullName;
    private String initials;
    private String jobTitle;
    private String departmentName;
    private String email;
    private String cardTheme;
    private String memberRole;
    private String status;
    private LocalDate joinedDate;
}
