package com.shed.teamden.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingCommitmentDto {
    private String id;
    private String dayText;
    private String title;
    private String sub;
    private String theme;
    private String icon;
    private String targetEventId;
}
