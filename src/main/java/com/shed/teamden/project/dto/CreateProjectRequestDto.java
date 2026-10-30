package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequestDto {
    private String name;
    private String description;
    private String status;
    private String dueDate;
}
