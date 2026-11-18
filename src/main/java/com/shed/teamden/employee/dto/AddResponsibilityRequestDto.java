package com.shed.teamden.employee.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddResponsibilityRequestDto {
    @NotBlank(message = "Responsibility title is required")
    private String title;
    private boolean primary;
}
