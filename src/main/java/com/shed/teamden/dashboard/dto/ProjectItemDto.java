package com.shed.teamden.dashboard.dto;

import com.shed.teamden.project.entity.ProjectStatus;
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
public class ProjectItemDto {
    private UUID id;
    private String name;
    private String description;
    private ProjectStatus status;
    private String ownerName;
    private LocalDate startDate;
    private LocalDate dueDate;
    private Integer progressPercentage;
    private long totalTasks;
    private long completedTasks;
}
