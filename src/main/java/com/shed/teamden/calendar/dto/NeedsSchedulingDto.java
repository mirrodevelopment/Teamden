package com.shed.teamden.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NeedsSchedulingDto {
    private String id;
    private String title;
    private String desc;
    private String project;
    private String actionLabel;
}
