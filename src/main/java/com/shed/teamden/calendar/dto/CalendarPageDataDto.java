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
public class CalendarPageDataDto {
    private List<CalendarEventDto> events;
    private List<UpcomingCommitmentDto> upcomingCommitments;
    private NextCommitmentDto nextCommitment;
    private List<NeedsSchedulingDto> needsScheduling;
    private List<ConnectedCalendarDto> calendars;
    private List<TeamMemberAvailabilityDto> teamAvailability;
}
