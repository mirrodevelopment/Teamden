package com.shed.teamden.dashboard.dto;

import com.shed.teamden.task.entity.TaskPriority;
import jakarta.validation.constraints.NotBlank;
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
public class CreateTaskRequest {

    @NotBlank(message = "Task title is required")
    private String title;

    private String description;
    private UUID projectId;
    private TaskPriority priority;
    private LocalDate dueDate;
}
