package com.shed.teamden.team.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamDto {

    private UUID id;
    private String name;
    private String code;
    private String description;
    private UUID departmentId;
    private String departmentName;
    private String category;
    private String status;
    private String logoUrl;
    private String visibility;
    private UUID teamLeadId;
    private String teamLeadName;
    private String teamLeadInitials;
    private String teamLeadJobTitle;
    private UUID assistantTeamLeadId;
    private String assistantTeamLeadName;
    private UUID reportingManagerId;
    private String reportingManagerName;
    private int memberCount;
    private List<TeamMemberDto> members;
    private List<String> permissions;
    private Instant createdAt;
    private String createdByName;
}
