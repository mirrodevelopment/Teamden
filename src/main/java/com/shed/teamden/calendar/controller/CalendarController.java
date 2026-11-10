package com.shed.teamden.calendar.controller;

import com.shed.teamden.calendar.dto.CalendarEventDto;
import com.shed.teamden.calendar.dto.CalendarPageDataDto;
import com.shed.teamden.calendar.dto.CreateCalendarEventRequestDto;
import com.shed.teamden.calendar.dto.UpdateCalendarEventRequestDto;
import com.shed.teamden.calendar.service.CalendarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    @GetMapping("/data")
    public ResponseEntity<CalendarPageDataDto> getCalendarPageData() {
        return ResponseEntity.ok(calendarService.getCalendarPageData());
    }

    @GetMapping("/events")
    public ResponseEntity<List<CalendarEventDto>> getEvents(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return ResponseEntity.ok(calendarService.getCalendarEvents(startDate, endDate));
    }

    @PostMapping("/events")
    public ResponseEntity<CalendarEventDto> createEvent(@RequestBody CreateCalendarEventRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarService.createEvent(request));
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<CalendarEventDto> updateEvent(
            @PathVariable String id,
            @RequestBody UpdateCalendarEventRequestDto request) {
        return ResponseEntity.ok(calendarService.updateEvent(id, request));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        calendarService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
