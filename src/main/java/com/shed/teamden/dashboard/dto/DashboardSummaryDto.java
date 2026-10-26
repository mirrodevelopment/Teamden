package com.shed.teamden.dashboard.dto;

import com.shed.teamden.auth.dto.UserProfileDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private UserProfileDto userProfile;
    private KpiMetricsDto kpis;
    private List<TaskItemDto> myTasks;
    private List<ProjectItemDto> projects;
    private List<ActivityItemDto> recentActivity;
    private AttendanceSummaryDto attendance;
}
