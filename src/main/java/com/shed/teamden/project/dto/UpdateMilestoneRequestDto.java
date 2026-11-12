package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMilestoneRequestDto {
    private String name;
    private Integer seqNum;
    private String status;      // UPCOMING, CURRENT, COMPLETED, DELAYED
    private String statusLabel; // e.g. "In Progress", "Completed"
    private String dueDate;     // ISO format YYYY-MM-DD
    private String description;
}
