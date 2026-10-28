package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityItemDto {
    private String id;
    private String time;
    private String dayLabel;
    private String dotColor; // purple, green, amber, blue
    private String badgeType; // COMMENT, COMPLETED, DOCUMENT, ASSIGNED
    private String author;
    private String actionText;
    private String targetTitle;
    private String subMeta;
    private String quotePreview;
}
