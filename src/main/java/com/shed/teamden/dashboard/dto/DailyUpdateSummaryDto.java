package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyUpdateSummaryDto {
    private boolean submitted;
    private UUID id;
    private String status;      // "SUBMITTED", "DRAFT", "PENDING"
    private String timeLabel;   // e.g. "10:45 AM"
    private String moodTag;     // e.g. "ON_TRACK"
    private String summaryText; // e.g. "Shared today at 10:45 AM"
}
