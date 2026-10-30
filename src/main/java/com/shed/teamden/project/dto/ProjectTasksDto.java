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
public class ProjectTasksDto {
    private String id;
    private String breadcrumb;
    private String title;
    private String owner;
    private String dueDate;
    private String status;

    // 01 / Work Status Summary
    private WorkStatusSummaryDto workStatus;

    // 02 / Work Register Task Groups
    private List<TaskGroupDto> taskGroups;

    // Right Column: Current Milestone
    private CurrentMilestoneDto currentMilestone;

    // Right Column: Blocked Tasks
    private List<BlockedTaskDto> blockedTasks;

    // Right Column: Tasks by Milestone
    private List<MilestoneSummaryDto> tasksByMilestone;

    // Right Column: Linked from Project Knowledge
    private List<KnowledgeDocDto> linkedKnowledge;

    // Right Column: Quick Actions
    private List<QuickActionDto> quickActions;

    public static ProjectTasksDto createDefault(String id, String name, String owner, String due, String status) {
        String pId = (id != null && !id.isBlank()) ? id : "featured-01";
        String pName = (name != null && !name.isBlank()) ? name : "website redesign.";
        String pOwner = (owner != null && !owner.isBlank()) ? owner : "Design Team";
        String pDue = (due != null && !due.isBlank()) ? due : "15 Nov 2026";
        String pStatus = (status != null && !status.isBlank()) ? (status.equalsIgnoreCase("ACTIVE") ? "Active" : status) : "Active";

        WorkStatusSummaryDto workStatus = WorkStatusSummaryDto.builder()
                .totalTasks(18)
                .todoCount(8)
                .todoPercent("44%")
                .inProgressCount(5)
                .inProgressPercent("28%")
                .inReviewCount(3)
                .inReviewPercent("17%")
                .completedCount(2)
                .completedPercent("11%")
                .blockedCount(2)
                .blockedSubtitle("of 18 tasks")
                .build();

        List<TaskItemDto> inProgressTasks = List.of(
                TaskItemDto.builder()
                        .id("T-014")
                        .title("Homepage development")
                        .milestone("Milestone 06")
                        .subtasksCount(3)
                        .linkedDocsCount(2)
                        .assigneeInitials("MJ")
                        .assigneeName("Maya J.")
                        .assigneeColor("#3B82F6")
                        .priority("High")
                        .priorityStyle("high")
                        .dueDate("28 Oct")
                        .dueDateColor("#DC2626")
                        .attachmentsCount(2)
                        .isBlocked(true)
                        .blockerReason("Waiting for design approval")
                        .build(),
                TaskItemDto.builder()
                        .id("T-026")
                        .title("Mobile optimisation")
                        .milestone("Milestone 06")
                        .subtasksCount(2)
                        .linkedDocsCount(1)
                        .assigneeInitials("PK")
                        .assigneeName("Paul K.")
                        .assigneeColor("#F97316")
                        .priority("Medium")
                        .priorityStyle("medium")
                        .dueDate("2 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(1)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-028")
                        .title("CMS implementation")
                        .milestone("Milestone 06")
                        .subtasksCount(4)
                        .linkedDocsCount(0)
                        .assigneeInitials("AR")
                        .assigneeName("Alex R.")
                        .assigneeColor("#8B5CF6")
                        .priority("Medium")
                        .priorityStyle("medium")
                        .dueDate("5 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(0)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-031")
                        .title("Analytics setup")
                        .milestone("Milestone 06")
                        .subtasksCount(2)
                        .linkedDocsCount(1)
                        .assigneeInitials("SK")
                        .assigneeName("Sara K.")
                        .assigneeColor("#14B8A6")
                        .priority("Low")
                        .priorityStyle("low")
                        .dueDate("7 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(1)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-035")
                        .title("SEO optimisation")
                        .milestone("Milestone 06")
                        .subtasksCount(3)
                        .linkedDocsCount(0)
                        .assigneeInitials("MJ")
                        .assigneeName("Maya J.")
                        .assigneeColor("#3B82F6")
                        .priority("Medium")
                        .priorityStyle("medium")
                        .dueDate("10 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(0)
                        .isBlocked(false)
                        .build()
        );

        List<TaskItemDto> inReviewTasks = List.of(
                TaskItemDto.builder()
                        .id("T-019")
                        .title("Design system review")
                        .milestone("Milestone 06")
                        .subtasksCount(2)
                        .linkedDocsCount(1)
                        .assigneeInitials("SK")
                        .assigneeName("Sara K.")
                        .assigneeColor("#14B8A6")
                        .priority("High")
                        .priorityStyle("high")
                        .dueDate("29 Oct")
                        .dueDateColor("#DC2626")
                        .attachmentsCount(3)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-022")
                        .title("User feedback collation")
                        .milestone("Milestone 06")
                        .subtasksCount(1)
                        .linkedDocsCount(2)
                        .assigneeInitials("AR")
                        .assigneeName("Alex R.")
                        .assigneeColor("#8B5CF6")
                        .priority("Medium")
                        .priorityStyle("medium")
                        .dueDate("1 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(1)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-025")
                        .title("Staging QA accessibility check")
                        .milestone("Milestone 06")
                        .subtasksCount(3)
                        .linkedDocsCount(0)
                        .assigneeInitials("PK")
                        .assigneeName("Paul K.")
                        .assigneeColor("#F97316")
                        .priority("Low")
                        .priorityStyle("low")
                        .dueDate("4 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(0)
                        .isBlocked(false)
                        .build()
        );

        List<TaskItemDto> todoTasks = List.of(
                TaskItemDto.builder()
                        .id("T-008")
                        .title("Prepare responsive tablet layouts")
                        .milestone("Milestone 06")
                        .subtasksCount(2)
                        .linkedDocsCount(1)
                        .assigneeInitials("AR")
                        .assigneeName("Alex R.")
                        .assigneeColor("#8B5CF6")
                        .priority("Medium")
                        .priorityStyle("medium")
                        .dueDate("12 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(1)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-010")
                        .title("Cookie consent banner implementation")
                        .milestone("Milestone 06")
                        .subtasksCount(1)
                        .linkedDocsCount(0)
                        .assigneeInitials("MJ")
                        .assigneeName("Maya J.")
                        .assigneeColor("#3B82F6")
                        .priority("Low")
                        .priorityStyle("low")
                        .dueDate("14 Nov")
                        .dueDateColor("#111111")
                        .attachmentsCount(0)
                        .isBlocked(false)
                        .build()
        );

        List<TaskItemDto> completedTasks = List.of(
                TaskItemDto.builder()
                        .id("T-001")
                        .title("Brand audit & color token definition")
                        .milestone("Milestone 05")
                        .subtasksCount(4)
                        .linkedDocsCount(3)
                        .assigneeInitials("MJ")
                        .assigneeName("Maya J.")
                        .assigneeColor("#3B82F6")
                        .priority("High")
                        .priorityStyle("high")
                        .dueDate("20 Oct")
                        .dueDateColor("#666666")
                        .attachmentsCount(2)
                        .isBlocked(false)
                        .build(),
                TaskItemDto.builder()
                        .id("T-004")
                        .title("User persona research synthesis")
                        .milestone("Milestone 05")
                        .subtasksCount(3)
                        .linkedDocsCount(2)
                        .assigneeInitials("SK")
                        .assigneeName("Sara K.")
                        .assigneeColor("#14B8A6")
                        .priority("Medium")
                        .priorityStyle("medium")
                        .dueDate("24 Oct")
                        .dueDateColor("#666666")
                        .attachmentsCount(1)
                        .isBlocked(false)
                        .build()
        );

        List<TaskGroupDto> taskGroups = List.of(
                TaskGroupDto.builder()
                        .key("IN_PROGRESS")
                        .label("IN PROGRESS")
                        .count(5)
                        .dotColor("#F59E0B")
                        .isExpanded(true)
                        .tasks(inProgressTasks)
                        .build(),
                TaskGroupDto.builder()
                        .key("IN_REVIEW")
                        .label("IN REVIEW")
                        .count(3)
                        .dotColor("#3B82F6")
                        .isExpanded(false)
                        .tasks(inReviewTasks)
                        .build(),
                TaskGroupDto.builder()
                        .key("TODO")
                        .label("TO DO")
                        .count(8)
                        .dotColor("#9CA3AF")
                        .isExpanded(false)
                        .tasks(todoTasks)
                        .build(),
                TaskGroupDto.builder()
                        .key("COMPLETED")
                        .label("COMPLETED")
                        .count(2)
                        .dotColor("#10B981")
                        .isCheckIcon(true)
                        .isExpanded(false)
                        .tasks(completedTasks)
                        .build()
        );

        CurrentMilestoneDto currentMilestone = CurrentMilestoneDto.builder()
                .number("06")
                .name("Review.")
                .activeTasksCount(5)
                .blockedTasksCount(2)
                .progressPercent(80)
                .build();

        List<BlockedTaskDto> blockedTasks = List.of(
                BlockedTaskDto.builder()
                        .id("T-014")
                        .title("Homepage development")
                        .reason("Waiting for design approval")
                        .build(),
                BlockedTaskDto.builder()
                        .id("T-026")
                        .title("Content migration")
                        .reason("Dependent on CMS access")
                        .build()
        );

        List<MilestoneSummaryDto> tasksByMilestone = List.of(
                MilestoneSummaryDto.builder().num("03").title("Development").count(5).isActive(false).build(),
                MilestoneSummaryDto.builder().num("04").title("Testing").count(4).isActive(false).build(),
                MilestoneSummaryDto.builder().num("05").title("Content").count(3).isActive(false).build(),
                MilestoneSummaryDto.builder().num("06").title("Review").count(5).isActive(true).build(),
                MilestoneSummaryDto.builder().num("07").title("Launch Prep").count(1).isActive(false).build()
        );

        List<KnowledgeDocDto> linkedKnowledge = List.of(
                KnowledgeDocDto.builder().title("Homepage Design Brief").linkedTasksCount(3).icon("file").build(),
                KnowledgeDocDto.builder().title("Content Strategy").linkedTasksCount(2).icon("file").build(),
                KnowledgeDocDto.builder().title("Brand Guidelines").linkedTasksCount(1).icon("link").build()
        );

        List<QuickActionDto> quickActions = List.of(
                QuickActionDto.builder().actionKey("create_task").title("Create new task").icon("plus").build(),
                QuickActionDto.builder().actionKey("import_doc").title("Import from document").icon("file-text").build(),
                QuickActionDto.builder().actionKey("manage_deps").title("Manage dependencies").icon("workflow").build()
        );

        return ProjectTasksDto.builder()
                .id(pId)
                .breadcrumb("PROJECTS / 02 / WEBSITE REDESIGN")
                .title(pName)
                .owner(pOwner)
                .dueDate(pDue)
                .status(pStatus)
                .workStatus(workStatus)
                .taskGroups(taskGroups)
                .currentMilestone(currentMilestone)
                .blockedTasks(blockedTasks)
                .tasksByMilestone(tasksByMilestone)
                .linkedKnowledge(linkedKnowledge)
                .quickActions(quickActions)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkStatusSummaryDto {
        private int totalTasks;
        private int todoCount;
        private String todoPercent;
        private int inProgressCount;
        private String inProgressPercent;
        private int inReviewCount;
        private String inReviewPercent;
        private int completedCount;
        private String completedPercent;
        private int blockedCount;
        private String blockedSubtitle;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskGroupDto {
        private String key;
        private String label;
        private int count;
        private String dotColor;
        private boolean isCheckIcon;
        private boolean isExpanded;
        private List<TaskItemDto> tasks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskItemDto {
        private String id;
        private String title;
        private String milestone;
        private int subtasksCount;
        private int linkedDocsCount;
        private String assigneeInitials;
        private String assigneeName;
        private String assigneeColor;
        private String priority;
        private String priorityStyle; // high, medium, low
        private String dueDate;
        private String dueDateColor;
        private int attachmentsCount;
        private boolean isBlocked;
        private String blockerReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentMilestoneDto {
        private String number;
        private String name;
        private int activeTasksCount;
        private int blockedTasksCount;
        private int progressPercent;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockedTaskDto {
        private String id;
        private String title;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneSummaryDto {
        private String num;
        private String title;
        private int count;
        private boolean isActive;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KnowledgeDocDto {
        private String title;
        private int linkedTasksCount;
        private String icon; // file, link
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickActionDto {
        private String actionKey;
        private String title;
        private String icon;
    }
}
