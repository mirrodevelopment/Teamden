package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectAttentionDto {
    private String id;
    private String indexNum;      // "01", "02", "03"
    private String statusType;    // "BLOCKED", "DELAY", "RESOURCE"
    private String statusDot;     // "red", "orange", "blue"
    private String metaLabel;     // "2 blockers", "At risk", "Needs follow-up"
    private String projectName;   // "Client Application", "Brand Development", "Content Library"
    private String detail;        // "2 blockers require input", "Design approval pending"
    private String dateLabel;     // "Since 18 Oct 2026", "Due 30 Oct 2026"
}
