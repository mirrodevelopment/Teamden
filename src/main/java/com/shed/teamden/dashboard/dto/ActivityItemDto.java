package com.shed.teamden.dashboard.dto;

import com.shed.teamden.activity.entity.ActivityEventType;
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
public class ActivityItemDto {
    private UUID id;
    private ActivityEventType eventType;
    private String title;
    private String description;
    private String actorName;
    private String actorInitials;
    private Instant eventTimestamp;
}
