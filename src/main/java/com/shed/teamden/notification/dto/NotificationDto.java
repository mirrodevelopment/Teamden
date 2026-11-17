package com.shed.teamden.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private UUID id;
    private String section;
    private String category;
    private String filterType;
    private String itemType;
    private String title;
    private String subtitle;
    private String quote;
    private String description;
    private String projectTitle;
    private UUID projectId;
    private String requesterName;
    private String requesterInitials;
    private String supportingDocTitle;
    private UUID supportingDocId;
    private String dueDateStr;
    private String actionLabel;
    private String actionUrl;
    private boolean isRead;
    private boolean isArchived;
    private boolean isSnoozed;
    private boolean isMuted;
    private int sortOrder;
    private String timeAgo;
    private Instant createdAt;
}
