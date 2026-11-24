package com.shed.teamden.team.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberInputDto {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private String memberRole;
}
