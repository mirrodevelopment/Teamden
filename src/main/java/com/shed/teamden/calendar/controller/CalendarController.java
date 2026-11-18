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
import java.util.Map;

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

    /** GET single event detail for meeting detail page */
    @GetMapping("/events/{id}")
    public ResponseEntity<CalendarEventDto> getEvent(@PathVariable String id) {
        return ResponseEntity.ok(calendarService.getEventById(id));
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

    /** PATCH meeting notes (autosave) */
    @PatchMapping("/events/{id}/notes")
    public ResponseEntity<Map<String, String>> updateNotes(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String notes = body.getOrDefault("notes", "");
        calendarService.updateMeetingNotes(id, notes);
        return ResponseEntity.ok(Map.of("status", "saved", "timestamp", java.time.Instant.now().toString()));
    }

    /** PATCH agenda items (comma-separated titles or JSON array string) */
    @PatchMapping("/events/{id}/agenda")
    public ResponseEntity<Map<String, String>> updateAgenda(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String agenda = body.getOrDefault("agenda", "");
        calendarService.updateMeetingAgenda(id, agenda);
        return ResponseEntity.ok(Map.of("status", "saved"));
    }

    /** PATCH decision for a meeting */
    @PatchMapping("/events/{id}/decision")
    public ResponseEntity<Map<String, String>> updateDecision(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        calendarService.updateMeetingDecision(id, body.getOrDefault("title", ""), body.getOrDefault("status", ""));
        return ResponseEntity.ok(Map.of("status", "saved"));
    }

    /** PATCH follow-up tasks (JSON string) */
    @PatchMapping("/events/{id}/followups")
    public ResponseEntity<Map<String, String>> updateFollowups(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        calendarService.updateMeetingFollowups(id, body.getOrDefault("followups", "[]"));
        return ResponseEntity.ok(Map.of("status", "saved"));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        calendarService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
