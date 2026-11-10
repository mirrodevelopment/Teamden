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
public class CalendarEventDto {
    private String id;
    private String title;
    private String date;
    private Integer dayOfWeek;
    private String startTime;
    private String endTime;
    private Integer startMinutes;
    private Integer endMinutes;
    private String project;
    private String sub;
    private String category;
    private String colorTheme;
    private String calendar;
    private String icon;
    private String location;
    private List<String> attendees;
    private String desc;

    // Rich Drawer Metadata
    private String breadcrumb;
    private List<String> agenda;
    private String notes;
    private String notesTimestamp;
    private Object decision;
    private List<Object> followups;
    private List<Object> attendeesList;
    private Object organizer;
    private String meetingUrl;
    private String rsvp;
}
