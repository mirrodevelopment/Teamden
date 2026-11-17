package com.shed.teamden.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResultDto {
    private UUID id;
    private String type;          // TASK, DOCUMENT, MEETING, DECISION, PROJECT, PERSON
    private String title;
    private String subtitle;
    private String meta;
    private String status;
    private String url;
    private String iconType;
    private String taskCode;
    private String description;
    private String priority;
    private String dueDate;
    private String date;
    private Integer linkedTasksCount;
    private String projectName;
    private String ownerInitials;
    private Long timestamp;
}
