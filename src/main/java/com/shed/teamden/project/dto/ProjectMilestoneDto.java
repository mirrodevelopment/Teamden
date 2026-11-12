package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMilestoneDto {
    private UUID id;
    private Integer seqNum;
    private String code;
    private String name;
    private String description;
    private String status;
    private String statusLabel;
    private LocalDate dueDate;
    private String dueDateFormatted;
    private Instant completedAt;
    private long tasksCount;
}
