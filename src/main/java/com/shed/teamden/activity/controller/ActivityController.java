package com.shed.teamden.activity.controller;

import com.shed.teamden.activity.dto.ActivityPageDataDto;
import com.shed.teamden.activity.service.ActivityService;
import com.shed.teamden.dashboard.dto.ActivityItemDto;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/activity")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/data")
    public ResponseEntity<ActivityPageDataDto> getActivityPageData(
            @RequestParam(value = "range", required = false) String range,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "type", required = false) String type,
            @RequestParam(value = "query", required = false) String query
    ) {
        return ResponseEntity.ok(activityService.getActivityPageData(range, startDate, endDate, type, query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityItemDto> getActivityById(@PathVariable("id") String id) {
        return ResponseEntity.ok(activityService.getActivityById(id));
    }
}
