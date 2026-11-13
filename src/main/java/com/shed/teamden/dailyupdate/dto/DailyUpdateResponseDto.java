package com.shed.teamden.dailyupdate.dto;

import com.shed.teamden.dailyupdate.entity.DailyUpdateMood;
import com.shed.teamden.dailyupdate.entity.DailyUpdateStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyUpdateResponseDto {
    private UUID id;
    private UUID userId;
    private String authorName;
    private String authorInitials;
    private LocalDate updateDate;
    private String workCompleted;
    private String workPlanned;
    private String blockers;
    private DailyUpdateStatus status;
    private DailyUpdateMood moodTag;
    private Instant createdAt;
    private Instant updatedAt;
    private String formattedTime;
    private String formattedDate;
    private boolean submitted;
}
