package com.shed.teamden.dashboard.dto;

import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
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
public class TaskItemDto {
    private UUID id;
    private String title;
    private String projectName;
    private UUID projectId;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate dueDate;
}
