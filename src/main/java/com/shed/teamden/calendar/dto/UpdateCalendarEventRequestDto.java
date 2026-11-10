package com.shed.teamden.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCalendarEventRequestDto {
    private String title;
    private String date; // YYYY-MM-DD
    private String startTime; // HH:mm
    private String endTime; // HH:mm
    private String project;
    private String sub;
    private String category;
    private String colorTheme;
    private String calendar;
    private String icon;
    private String location;
    private List<String> attendees;
    private String desc;
}
