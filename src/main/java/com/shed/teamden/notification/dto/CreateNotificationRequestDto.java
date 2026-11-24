package com.shed.teamden.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequestDto {
    private String title;
    private String subtitle;
    private String quote;
    private String description;
    private String category;    // "NEEDS_ACTION", "UPDATES"
    private String section;     // "ATTENTION_QUEUE", "REGISTER_TODAY", "REGISTER_EARLIER"
    private String filterType;  // "ALL", "MENTIONS", "FOLLOWING"
    private String itemType;    // "APPROVAL", "FEEDBACK", "HANDOFF", "MENTION", "ASSIGNMENT", "DECISION", "CALENDAR"
    private String projectTitle;
    private String requesterName;
    private String requesterInitials;
    private String supportingDocTitle;
    private String dueDateStr;
    private String actionLabel;
    private String actionUrl;
}
