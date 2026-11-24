package com.shed.teamden.overview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverviewDataDto {
    private String organizationName;
    private KpiMetricsDto kpis;
    private PulseSummaryDto pulse;
    private List<OverviewProjectDto> projects;
    private List<OverviewDecisionDto> decisions;
    private List<OverviewDependencyDto> dependencies;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KpiMetricsDto {
        private long activeProjects;
        private long pendingDecisions;
        private long blockedHandoffs;
        private long upcomingMilestones;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PulseSummaryDto {
        private String heading;
        private String subtext;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewProjectDto {
        private String id;
        private String name;
        private String team;
        private String activityType;
        private String activityText;
        private String statusKey;
        private String statusLabel;
        private String teamCategory;
        private String dueDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewDecisionDto {
        private String id;
        private String iconType;
        private String title;
        private String project;
        private String meta;
        private String team;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewDependencyDto {
        private String id;
        private String tag;
        private String title;
        private String status;
        private String statusClass;
        private String details;
        private String team;
    }
}
