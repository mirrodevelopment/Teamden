package com.shed.teamden.task.dto;

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
public class CreateTaskRequestDto {
    private String title;
    private String description;
    private String column;       // "NOW", "NEXT", "LATER"
    private String priority;     // "HIGH", "MEDIUM", "LOW", "URGENT"
    private String status;       // "TODO", "IN_PROGRESS", "IN_REVIEW", "BLOCKED"
    private UUID projectId;
    private String projectTag;   // Fallback string for project name
    private UUID assigneeId;
    private LocalDate dueDate;
}
