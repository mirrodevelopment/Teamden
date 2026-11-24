package com.shed.teamden.team.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class CreateTeamRequestDto {

    @NotBlank(message = "Team name is required")
    private String name;

    private String code;

    @NotBlank(message = "Team description is required")
    private String description;

    @NotNull(message = "Department is required")
    private UUID departmentId;

    private String category;

    @NotNull(message = "Team Lead is required")
    private UUID teamLeadId;

    private UUID assistantTeamLeadId;

    private UUID reportingManagerId;

    private String visibility;

    private String logoUrl;

    @NotEmpty(message = "At least one team member is required")
    @Valid
    private List<TeamMemberInputDto> members;
}
