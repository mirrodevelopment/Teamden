package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDashboardDto {
    private String workspaceBreadcrumb;
    private String currentDateLabel;
    private long totalProjects;
    private long activeCount;
    private long atRiskCount;
    private long dueSoonCount;
    private ProjectItemDto featuredProject;
    private List<ProjectItemDto> projects;
    private List<DecisionItemDto> decisionsRequired;
    private List<ProjectAttentionDto> projectAttention;
    private List<UpcomingMilestoneDto> upcomingMilestones;
}
