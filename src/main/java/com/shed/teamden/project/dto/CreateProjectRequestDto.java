package com.shed.teamden.project.dto;

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
public class CreateProjectRequestDto {
    private String name;
    private String description;
    private String status;
    private String health;
    private String priority;
    private String projectType;
    private String category;
    private String startDate;
    private String dueDate;
    private UUID ownerId;

    // Brick Universal Create Project Fields
    private String projectCode;
    private UUID teamId;
    private String teamName;
    private UUID teamLeadId;
    private String clientName;
    private String coverImageUrl;
    private String goals;
    private String deliverables;
    private String tags;
    private List<UUID> memberIds;
}
