package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DecisionItemDto {
    private String id;
    private String projectTag;      // "WEBSITE REDESIGN"
    private String title;           // "Brand Development"
    private String subTitle;        // "Identity approval"
    private String dueDate;         // "Due 30 Oct 2026"
    private String indicatorColor;  // "amber", "red"
    private boolean hasAction;      // true for first item with Review button
    private String actionLabel;     // "Review →"
}
