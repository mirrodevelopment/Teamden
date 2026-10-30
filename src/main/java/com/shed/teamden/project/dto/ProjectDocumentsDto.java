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
public class ProjectDocumentsDto {
    private String id;
    private String breadcrumb;
    private String title;
    private String owner;
    private String dueDate;
    private String status;

    private LibraryDto library;
    private DocumentViewerDto activeDocument;

    public static ProjectDocumentsDto createDefault(String id, String name, String owner, String due, String status) {
        String pId = (id != null && !id.isBlank()) ? id : "featured-01";
        String pName = (name != null && !name.isBlank()) ? name : "website redesign.";
        String pOwner = (owner != null && !owner.isBlank()) ? owner : "Design Team";
        String pDue = (due != null && !due.isBlank()) ? due : "15 Nov 2026";
        String pStatus = (status != null && !status.isBlank()) ? (status.equalsIgnoreCase("ACTIVE") ? "Active" : status) : "Active";

        List<DocumentItemDto> docs = List.of(
                DocumentItemDto.builder()
                        .id("doc-01")
                        .title("Design Review Notes")
                        .category("Meeting Notes")
                        .categoryKey("Notes")
                        .updatedAt("Updated today")
                        .docNumber("DOCUMENT / 003")
                        .isSelected(true)
                        .build(),
                DocumentItemDto.builder()
                        .id("doc-02")
                        .title("Project Brief")
                        .category("Foundation")
                        .categoryKey("Plans")
                        .updatedAt("Updated 2 days ago")
                        .docNumber("DOCUMENT / 001")
                        .isSelected(false)
                        .build(),
                DocumentItemDto.builder()
                        .id("doc-03")
                        .title("Design Guidelines")
                        .category("Reference")
                        .categoryKey("Design")
                        .updatedAt("Updated 4 days ago")
                        .docNumber("DOCUMENT / 002")
                        .isSelected(false)
                        .build(),
                DocumentItemDto.builder()
                        .id("doc-04")
                        .title("Research & References")
                        .category("Research")
                        .categoryKey("Other")
                        .updatedAt("Updated 1 week ago")
                        .docNumber("DOCUMENT / 004")
                        .isSelected(false)
                        .build(),
                DocumentItemDto.builder()
                        .id("doc-05")
                        .title("Client Feedback")
                        .category("Meeting Notes")
                        .categoryKey("Notes")
                        .updatedAt("Updated 1 week ago")
                        .docNumber("DOCUMENT / 005")
                        .isSelected(false)
                        .build(),
                DocumentItemDto.builder()
                        .id("doc-06")
                        .title("Technical Requirements")
                        .category("Specification")
                        .categoryKey("Plans")
                        .updatedAt("Updated 1 week ago")
                        .docNumber("DOCUMENT / 006")
                        .isSelected(false)
                        .build(),
                DocumentItemDto.builder()
                        .id("doc-07")
                        .title("Content Strategy")
                        .category("Plan")
                        .categoryKey("Plans")
                        .updatedAt("Updated 2 weeks ago")
                        .docNumber("DOCUMENT / 007")
                        .isSelected(false)
                        .build()
        );

        LibraryDto library = LibraryDto.builder()
                .title("PROJECT LIBRARY")
                .categories(List.of("All", "Notes", "Plans", "Design", "Other"))
                .activeCategory("All")
                .documents(docs)
                .build();

        DocumentViewerDto viewer = DocumentViewerDto.builder()
                .docNumber("DOCUMENT / 003")
                .title("Design review notes.")
                .category("Meeting Notes")
                .date("25 Oct 2026")
                .team("Design Team")
                .savedStatus("Saved 2 minutes ago")
                .collaborators(List.of(
                        CollaboratorDto.builder().initials("MJ").name("Maria J.").colorClass("avatar-mj").build(),
                        CollaboratorDto.builder().initials("PK").name("Peter K.").colorClass("avatar-pk").build(),
                        CollaboratorDto.builder().initials("AR").name("Alex R.").colorClass("avatar-ar").build()
                ))
                .attendees(List.of(
                        AttendeeDto.builder().initials("MJ").name("Maria J.").colorClass("avatar-mj").build(),
                        AttendeeDto.builder().initials("PK").name("Peter K.").colorClass("avatar-pk").build(),
                        AttendeeDto.builder().initials("AR").name("Alex R.").colorClass("avatar-ar").build(),
                        AttendeeDto.builder().initials("SK").name("Sarah K.").colorClass("avatar-sk").build()
                ))
                .discussionParagraph1("We reviewed the latest homepage designs and discussed the overall structure, navigation and visual direction.")
                .discussionHighlighted("We also agreed to simplify the mobile navigation and reduce unnecessary interface controls.")
                .discussionParagraph2Remainder(" The revised approach will improve usability and content strategy.")
                .linkedTask(LinkedTaskDto.builder()
                        .title("Create linked task")
                        .description("Simplify the mobile navigation and reduce unnecessary interface controls.")
                        .assigneeName("Peter K.")
                        .assigneeInitials("PK")
                        .dueDate("28 Oct 2026")
                        .build())
                .decisions(List.of(
                        DecisionItemDto.builder()
                                .id("DEC-01")
                                .status("APPROVED")
                                .statusLabel("Approved by team")
                                .title("Proceed with the revised homepage design.")
                                .date("25 Oct 2026")
                                .metadata("Approved by team · 25 Oct 2026")
                                .linkedTaskId("T-021")
                                .build(),
                        DecisionItemDto.builder()
                                .id("DEC-02")
                                .status("AWAITING_REVIEW")
                                .statusLabel("Awaiting review")
                                .title("Review mobile navigation after prototype development.")
                                .date("28 Oct 2026")
                                .ownerInitials("PK")
                                .metadata("Awaiting review · Owner: PK · Due 28 Oct 2026")
                                .build()
                ))
                .nextSteps(List.of(
                        NextStepItemDto.builder().id("ns-01").text("Develop the revised mobile navigation prototype.").completed(false).build(),
                        NextStepItemDto.builder().id("ns-02").text("Review with the client for final feedback.").completed(false).build(),
                        NextStepItemDto.builder().id("ns-03").text("Prepare implementation tasks for development phase.").completed(false).build()
                ))
                .build();

        return ProjectDocumentsDto.builder()
                .id(pId)
                .breadcrumb("PROJECTS / 02 / WEBSITE REDESIGN")
                .title(pName)
                .owner(pOwner)
                .dueDate(pDue)
                .status(pStatus)
                .library(library)
                .activeDocument(viewer)
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LibraryDto {
        private String title;
        private List<String> categories;
        private String activeCategory;
        private List<DocumentItemDto> documents;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentItemDto {
        private String id;
        private String title;
        private String category;
        private String categoryKey;
        private String updatedAt;
        private String docNumber;
        private boolean isSelected;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentViewerDto {
        private String docNumber;
        private String title;
        private String category;
        private String date;
        private String team;
        private String savedStatus;
        private List<CollaboratorDto> collaborators;
        private List<AttendeeDto> attendees;
        private String discussionParagraph1;
        private String discussionHighlighted;
        private String discussionParagraph2Remainder;
        private LinkedTaskDto linkedTask;
        private List<DecisionItemDto> decisions;
        private List<NextStepItemDto> nextSteps;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CollaboratorDto {
        private String initials;
        private String name;
        private String colorClass;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendeeDto {
        private String initials;
        private String name;
        private String colorClass;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LinkedTaskDto {
        private String title;
        private String description;
        private String assigneeName;
        private String assigneeInitials;
        private String dueDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DecisionItemDto {
        private String id;
        private String status;
        private String statusLabel;
        private String title;
        private String date;
        private String ownerInitials;
        private String metadata;
        private String linkedTaskId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextStepItemDto {
        private String id;
        private String text;
        private boolean completed;
    }
}
