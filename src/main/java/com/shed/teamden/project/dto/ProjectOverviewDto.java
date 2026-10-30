package com.shed.teamden.project.dto;

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
public class ProjectOverviewDto {
    private String id;
    private String breadcrumb;
    private String title;
    private String description;
    private String owner;
    private String dueDate;
    private String projectType;
    private String health;
    private String healthDotColor;
    private String status;
    private String statusDotColor;

    // 01 / Project Specification
    private SpecificationDto specification;

    // 02 / Milestones
    private String milestonesSummary;
    private int milestonesCompleted;
    private int milestonesTotal;
    private List<MilestoneStageDto> milestonesList;

    // 03 / Work in Motion
    private List<WorkStatusCardDto> workInMotion;

    // 04 / Project Knowledge
    private List<ProjectDocumentDto> knowledgeDocuments;

    // Right Column: Project Health
    private int unresolvedBlockersCount;
    private String healthHeading;
    private String healthDescription;

    // Right Column: Decision Register
    private PendingDecisionDto pendingDecision;
    private int moreDecisionsCount;

    // Right Column: Project Team
    private List<String> teamMemberInitials;
    private int totalTeamMembers;

    public static ProjectOverviewDto createDefault(String id, String name, String desc, String owner, String due, String status) {
        String pId = (id != null && !id.isBlank()) ? id : "featured-01";
        String pName = (name != null && !name.isBlank()) ? name : "Website Redesign";
        String pDesc = (desc != null && !desc.isBlank()) ? desc : "Redesign the website into a responsive, modern experience with clearer navigation, stronger visual identity and an intuitive customer journey.";
        String pOwner = (owner != null && !owner.isBlank()) ? owner : "Design Team";
        String pDue = (due != null && !due.isBlank()) ? due : "15 Nov 2026";
        String pStatus = (status != null && !status.isBlank()) ? (status.equalsIgnoreCase("ACTIVE") ? "Active" : status) : "Active";

        SpecificationDto spec = SpecificationDto.builder()
                .title("Build a better digital experience.")
                .objectives(List.of(
                        "Improve user experience",
                        "Increase conversion rate",
                        "Strengthen brand presence"
                ))
                .deliverables(List.of(
                        "Responsive website (desktop, tablet, mobile)",
                        "CMS implementation",
                        "Content migration"
                ))
                .successCriteria(List.of(
                        "Higher engagement",
                        "Increased conversion rate",
                        "Meets accessibility standards"
                ))
                .projectContext(Map.of(
                        "Client", "Acme Co.",
                        "Type", "Design / Development",
                        "Focus", "Brand, performance and growth"
                ))
                .build();

        List<MilestoneStageDto> milestones = List.of(
                MilestoneStageDto.builder().id("m-1").seqNum("01").name("Discovery").status("COMPLETED").build(),
                MilestoneStageDto.builder().id("m-2").seqNum("02").name("Design").status("COMPLETED").build(),
                MilestoneStageDto.builder().id("m-3").seqNum("03").name("Development").status("COMPLETED").build(),
                MilestoneStageDto.builder().id("m-4").seqNum("04").name("Testing").status("COMPLETED").build(),
                MilestoneStageDto.builder().id("m-5").seqNum("05").name("Content").status("COMPLETED").build(),
                MilestoneStageDto.builder().id("m-6").seqNum("06").name("Review").status("CURRENT").statusLabel("In Progress").build(),
                MilestoneStageDto.builder().id("m-7").seqNum("07").name("Launch Prep").status("UPCOMING").build(),
                MilestoneStageDto.builder().id("m-8").seqNum("08").name("Go Live").status("UPCOMING").build(),
                MilestoneStageDto.builder().id("m-9").seqNum("09").name("Post Launch").status("UPCOMING").build()
        );

        List<WorkStatusCardDto> workCards = List.of(
                WorkStatusCardDto.builder()
                        .statusKey("TODO")
                        .statusLabel("TO DO")
                        .dotColor("gray")
                        .count("08")
                        .exampleTask("Prepare responsive layouts")
                        .assigneeAvatar("AR")
                        .build(),
                WorkStatusCardDto.builder()
                        .statusKey("IN_PROGRESS")
                        .statusLabel("IN PROGRESS")
                        .dotColor("amber")
                        .count("05")
                        .exampleTask("Homepage development")
                        .assigneeAvatar("MJ")
                        .build(),
                WorkStatusCardDto.builder()
                        .statusKey("IN_REVIEW")
                        .statusLabel("IN REVIEW")
                        .dotColor("blue")
                        .count("03")
                        .exampleTask("Design system review")
                        .assigneeAvatar("SK")
                        .build(),
                WorkStatusCardDto.builder()
                        .statusKey("BLOCKED")
                        .statusLabel("BLOCKED")
                        .dotColor("red")
                        .count("02")
                        .exampleTask("Client copy approval")
                        .assigneeAvatar("PK")
                        .build()
        );

        List<ProjectDocumentDto> docs = List.of(
                ProjectDocumentDto.builder()
                        .name("Project Brief")
                        .fileType("PDF")
                        .fileSize("1.2 MB")
                        .iconType("pdf")
                        .build(),
                ProjectDocumentDto.builder()
                        .name("Design Review Notes")
                        .fileType("DOC")
                        .fileSize("850 KB")
                        .iconType("doc")
                        .build(),
                ProjectDocumentDto.builder()
                        .name("Design References")
                        .fileType("Figma")
                        .fileSize("24 MB")
                        .iconType("figma")
                        .build()
        );

        PendingDecisionDto pendingDecision = PendingDecisionDto.builder()
                .statusLabel("Awaiting Your Review")
                .dueDateLabel("30 Oct")
                .title("Homepage design approval")
                .description("Final design requires your review before development continues.")
                .ownerName("Alex R.")
                .ownerInitials("AR")
                .build();

        return ProjectOverviewDto.builder()
                .id(pId)
                .breadcrumb("PROJECTS / 02 / " + pName.toUpperCase())
                .title(pName)
                .description(pDesc)
                .owner(pOwner)
                .dueDate(pDue)
                .projectType("Design / Development")
                .health("At Risk")
                .healthDotColor("orange")
                .status(pStatus)
                .statusDotColor("green")
                .specification(spec)
                .milestonesSummary("06/09 COMPLETED")
                .milestonesCompleted(6)
                .milestonesTotal(9)
                .milestonesList(milestones)
                .workInMotion(workCards)
                .knowledgeDocuments(docs)
                .unresolvedBlockersCount(2)
                .healthHeading("Unresolved blockers")
                .healthDescription("Two issues need attention before the next milestone.")
                .pendingDecision(pendingDecision)
                .moreDecisionsCount(2)
                .teamMemberInitials(List.of("PK", "AR", "SK", "MJ"))
                .totalTeamMembers(4)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecificationDto {
        private String title;
        private List<String> objectives;
        private List<String> deliverables;
        private List<String> successCriteria;
        private Map<String, String> projectContext;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneStageDto {
        private String id;
        private String seqNum;
        private String name;
        private String status; // COMPLETED, CURRENT, UPCOMING
        private String statusLabel; // e.g. "In Progress"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkStatusCardDto {
        private String statusKey; // Status keys: TO_DO, IN_PROGRESS, IN_REVIEW, BLOCKED
        private String statusLabel;
        private String dotColor;
        private String count;
        private String exampleTask;
        private String assigneeAvatar;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectDocumentDto {
        private String name;
        private String fileType;
        private String fileSize;
        private String iconType;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PendingDecisionDto {
        private String statusLabel;
        private String dueDateLabel;
        private String title;
        private String description;
        private String ownerName;
        private String ownerInitials;
    }
}
