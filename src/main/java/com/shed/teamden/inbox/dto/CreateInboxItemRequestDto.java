package com.shed.teamden.inbox.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInboxItemRequestDto {
    private String title;
    private String subtitle;
    private String quote;
    private String description;
    private String section;
    private String category;
    private String filterType;
    private String itemType;
    private String projectTitle;
    private UUID projectId;
    private String requesterName;
    private String requesterInitials;
    private String supportingDocTitle;
    private UUID supportingDocId;
    private String dueDateStr;
    private String actionLabel;
    private String actionUrl;
    private UUID targetUserId;
}
