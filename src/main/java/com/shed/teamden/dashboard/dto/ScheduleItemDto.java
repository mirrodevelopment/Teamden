package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleItemDto {
    private String id;
    private String time;
    private String title;
    private String subMeta;
    private String dotColor; // green, purple, gray, blue
}
