package com.shed.teamden.dailyupdate.controller;

import com.shed.teamden.dailyupdate.dto.DailyUpdateRequestDto;
import com.shed.teamden.dailyupdate.dto.DailyUpdateResponseDto;
import com.shed.teamden.dailyupdate.dto.DailyUpdateSuggestionDto;
import com.shed.teamden.dailyupdate.service.DailyUpdateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/daily-updates")
@RequiredArgsConstructor
public class DailyUpdateController {

    private final DailyUpdateService dailyUpdateService;

    @GetMapping("/today")
    public ResponseEntity<DailyUpdateResponseDto> getTodayUpdate() {
        return ResponseEntity.ok(dailyUpdateService.getTodayUpdateForCurrentUser());
    }

    @PostMapping
    public ResponseEntity<DailyUpdateResponseDto> saveOrPublishDailyUpdate(
            @Valid @RequestBody DailyUpdateRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(dailyUpdateService.saveOrPublishDailyUpdate(request));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<DailyUpdateSuggestionDto> getSuggestions() {
        return ResponseEntity.ok(dailyUpdateService.getSuggestionsForToday());
    }

    @GetMapping
    public ResponseEntity<List<DailyUpdateResponseDto>> getTeamUpdates(
            @RequestParam(value = "date", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(dailyUpdateService.getTeamUpdatesForDate(date));
    }
}
