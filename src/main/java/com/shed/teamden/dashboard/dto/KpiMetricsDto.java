package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiMetricsDto {
    private long activeProjects;
    private long openTasks;
    private long tasksCompletedThisWeek;
    private long teamMembersPresentToday;
}
