package com.shed.teamden.overview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InsightsDataDto {
    private Map<String, MetricConfigDto> metrics;
    private Map<String, TeamPerformanceDto> performance;
    private List<OverviewDataDto.OverviewDecisionDto> decisions;
    private List<LateMilestoneDto> lateMilestones;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricConfigDto {
        private String label;
        private String heading;
        private Map<String, PeriodMetricDto> periods;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeriodMetricDto {
        private String rate;
        private String completedCount;
        private String completedText;
        private String deltaText;
        private String banner;
        private List<TrendPointDto> points;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendPointDto {
        private String label;
        private int val;
        private boolean active;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamPerformanceDto {
        private String throughput;
        private String cycleTime;
        private String predictability;
        private String satisfaction;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LateMilestoneDto {
        private String id;
        private String project;
        private String title;
        private String due;
        private String daysLate;
        private String owner;
    }
}
