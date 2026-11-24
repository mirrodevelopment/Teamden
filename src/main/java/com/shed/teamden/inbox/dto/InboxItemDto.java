package com.shed.teamden.inbox.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class InboxItemDto {
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

    @JsonProperty("isRead")
    private boolean isRead;

    @JsonProperty("isArchived")
    private boolean isArchived;

    @JsonProperty("isSnoozed")
    private boolean isSnoozed;

    @JsonProperty("isMuted")
    private boolean isMuted;

    private int sortOrder;
    private String timeAgo;
    private Instant createdAt;

    @JsonProperty("read")
    public boolean isReadProperty() {
        return isRead;
    }

    @JsonProperty("archived")
    public boolean isArchivedProperty() {
        return isArchived;
    }

    @JsonProperty("snoozed")
    public boolean isSnoozedProperty() {
        return isSnoozed;
    }

    @JsonProperty("muted")
    public boolean isMutedProperty() {
        return isMuted;
    }
}
