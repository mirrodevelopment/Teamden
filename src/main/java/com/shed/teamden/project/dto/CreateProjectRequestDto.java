package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequestDto {
    private String name;
    private String description;
    private String status;
    private String health;
    private String priority;
    private String projectType;
    private String startDate;
    private String dueDate;
    private UUID ownerId;
}
