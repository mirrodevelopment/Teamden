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
public class ProjectActivityDto {
    private String id;
    private String breadcrumb;
    private String title;
    private String owner;
    private String dueDate;
    private String status;

    private SinceLastVisitDto sinceLastVisit;
    private ActivityFilterCountsDto filterCounts;
    private List<ActivityDateGroupDto> dateGroups;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SinceLastVisitDto {
        private int count;
        private String title;
        private String description;
        private String actionLabel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityFilterCountsDto {
        private int milestones;
        private int decisions;
        private int taskUpdates;
        private int documentActivity;
        private int comments;
        private int filesAndAttachments;
        private int mentions;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDateGroupDto {
        private String dayNumber;
        private String monthYear;
        private String weekday;
        private String fullDate;
        private List<ActivityEventDto> events;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityEventDto {
        private String id;
        private String time;
        private String category;
        private String categoryKey; // milestones, decisions, tasks, documents, comments, files, mentions
        private String dotColor; // lime, amber, blue, purple, gray
        private String iconType; // flag, comment, check-circle, document, decision, attachment
        private String iconBgClass;
        private String title;
        private String description;
        private String statusFrom;
        private String statusTo;
        private String userInitials;
        private String userName;
        private String userTeam;
        private String avatarColor;
        private String actionLabel;
        private String actionType;
        private String actionTargetId;
        private boolean isImportant;
        private boolean isMention;
    }
}
