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

    public static ProjectActivityDto createDefault(String id, String name, String owner, String due, String status) {
        String pId = (id != null && !id.isBlank()) ? id : "featured-01";
        String pName = (name != null && !name.isBlank()) ? name : "website redesign.";
        String pOwner = (owner != null && !owner.isBlank()) ? owner : "Design Team";
        String pDue = (due != null && !due.isBlank()) ? due : "15 Nov 2026";
        String pStatus = (status != null && !status.isBlank()) ? (status.equalsIgnoreCase("ACTIVE") ? "Active" : status) : "Active";

        SinceLastVisitDto lastVisit = SinceLastVisitDto.builder()
                .count(6)
                .title("Relevant updates")
                .description("Including one decision requiring your review.")
                .actionLabel("Review new activity ↗")
                .build();

        ActivityFilterCountsDto counts = ActivityFilterCountsDto.builder()
                .milestones(6)
                .decisions(4)
                .taskUpdates(18)
                .documentActivity(12)
                .comments(9)
                .filesAndAttachments(5)
                .mentions(7)
                .build();

        // Date Group 1: 26 OCT 2026 MONDAY
        ActivityDateGroupDto group26 = ActivityDateGroupDto.builder()
                .dayNumber("26")
                .monthYear("OCT 2026")
                .weekday("MONDAY")
                .fullDate("2026-10-26")
                .events(List.of(
                        ActivityEventDto.builder()
                                .id("act-01")
                                .time("09:42")
                                .category("MILESTONE COMPLETED")
                                .categoryKey("milestones")
                                .dotColor("lime")
                                .iconType("flag")
                                .iconBgClass("icon-bg-lime")
                                .title("Design approved.")
                                .description("Milestone 05 / Design has been completed and work can proceed to the next stage.")
                                .userInitials("MJ")
                                .userName("Maria J.")
                                .userTeam("Design Team")
                                .avatarColor("avatar-mj")
                                .actionLabel("View milestone ↗")
                                .actionType("milestone")
                                .actionTargetId("ms-05")
                                .isImportant(true)
                                .isMention(false)
                                .build(),
                        ActivityEventDto.builder()
                                .id("act-02")
                                .time("08:15")
                                .category("COMMENT")
                                .categoryKey("comments")
                                .dotColor("amber")
                                .iconType("comment")
                                .iconBgClass("icon-bg-amber")
                                .title("Alex R. commented on Design Review Notes.")
                                .description("\"The navigation direction looks good. Please refine the mobile interaction.\"")
                                .userInitials("AR")
                                .userName("Alex R.")
                                .userTeam("Design Team")
                                .avatarColor("avatar-ar")
                                .actionLabel("Open discussion ↗")
                                .actionType("comment")
                                .actionTargetId("doc-01")
                                .isImportant(true)
                                .isMention(true)
                                .build(),
                        ActivityEventDto.builder()
                                .id("act-03")
                                .time("07:28")
                                .category("TASK UPDATED")
                                .categoryKey("tasks")
                                .dotColor("blue")
                                .iconType("check-circle")
                                .iconBgClass("icon-bg-blue")
                                .title("Homepage development moved to In Progress.")
                                .description("Status changed from")
                                .statusFrom("To Do")
                                .statusTo("In Progress")
                                .userInitials("PK")
                                .userName("Peter K.")
                                .userTeam("Development")
                                .avatarColor("avatar-pk")
                                .actionLabel("View task ↗")
                                .actionType("task")
                                .actionTargetId("T-014")
                                .isImportant(true)
                                .isMention(false)
                                .build()
                ))
                .build();

        // Date Group 2: 25 OCT 2026 SUNDAY
        ActivityDateGroupDto group25 = ActivityDateGroupDto.builder()
                .dayNumber("25")
                .monthYear("OCT 2026")
                .weekday("SUNDAY")
                .fullDate("2026-10-25")
                .events(List.of(
                        ActivityEventDto.builder()
                                .id("act-04")
                                .time("15:30")
                                .category("DOCUMENT UPDATED")
                                .categoryKey("documents")
                                .dotColor("purple")
                                .iconType("document")
                                .iconBgClass("icon-bg-purple")
                                .title("Design Review Notes updated.")
                                .description("Version 2.3 · 5 changes")
                                .userInitials("PK")
                                .userName("Peter K.")
                                .userTeam("Design Team")
                                .avatarColor("avatar-pk")
                                .actionLabel("View changes ↗")
                                .actionType("document")
                                .actionTargetId("doc-01")
                                .isImportant(true)
                                .isMention(false)
                                .build(),
                        ActivityEventDto.builder()
                                .id("act-05")
                                .time("11:14")
                                .category("DECISION RECORDED")
                                .categoryKey("decisions")
                                .dotColor("amber")
                                .iconType("decision")
                                .iconBgClass("icon-bg-amber")
                                .title("Homepage layout approved (pending client confirmation).")
                                .description("Awaiting final client sign-off.")
                                .userInitials("MJ")
                                .userName("Maria J.")
                                .userTeam("Design Team")
                                .avatarColor("avatar-mj")
                                .actionLabel("View decision ↗")
                                .actionType("decision")
                                .actionTargetId("dec-01")
                                .isImportant(true)
                                .isMention(false)
                                .build(),
                        ActivityEventDto.builder()
                                .id("act-06")
                                .time("09:02")
                                .category("FILE ADDED")
                                .categoryKey("files")
                                .dotColor("gray")
                                .iconType("attachment")
                                .iconBgClass("icon-bg-gray")
                                .title("Added file to Project Brief.")
                                .description("homepage-wireframes-v2.fig · 12 MB")
                                .userInitials("SK")
                                .userName("Sarah K.")
                                .userTeam("Design Team")
                                .avatarColor("avatar-sk")
                                .actionLabel("Open document ↗")
                                .actionType("file")
                                .actionTargetId("doc-02")
                                .isImportant(false)
                                .isMention(false)
                                .build()
                ))
                .build();

        return ProjectActivityDto.builder()
                .id(pId)
                .breadcrumb("PROJECTS / 02 / WEBSITE REDESIGN")
                .title(pName)
                .owner(pOwner)
                .dueDate(pDue)
                .status(pStatus)
                .sinceLastVisit(lastVisit)
                .filterCounts(counts)
                .dateGroups(List.of(group26, group25))
                .build();
    }

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
