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

    public static ProjectDocumentsDto createDefault(String id, String name, String owner, String due, String status) {
        String pId = (id != null && !id.isBlank()) ? id : "featured-01";
        String pName = (name != null && !name.isBlank()) ? name : "Workspace Project";
        String pOwner = (owner != null && !owner.isBlank()) ? owner : "Workspace";
        String pDue = (due != null && !due.isBlank()) ? due : "15 Nov 2026";
        String pStatus = (status != null && !status.isBlank()) ? status : "Active";

        LibraryDto library = LibraryDto.builder()
                .title("Project Documents")
                .categories(List.of("All", "Briefs", "Notes", "Specifications", "Reviews"))
                .activeCategory("All")
                .documents(List.of())
                .build();

        return ProjectDocumentsDto.builder()
                .id(pId)
                .breadcrumb("PROJECTS / 02 / " + pName.toUpperCase())
                .title(pName)
                .owner(pOwner)
                .dueDate(pDue)
                .status(pStatus)
                .library(library)
                .activeDocument(null)
                .build();
    }
}
