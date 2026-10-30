package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingMilestoneDto {
    private String id;
    private String dateDayMonth;  // "27 OCT", "30 OCT"
    private String dotColor;      // "green", "amber", "red", "black"
    private String title;         // "Brand Guidelines", "Client Application"
    private String subTitle;      // "Final design review", "Beta build release"
}
