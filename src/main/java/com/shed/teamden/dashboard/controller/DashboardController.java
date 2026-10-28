package com.shed.teamden.dashboard.controller;

import com.shed.teamden.dashboard.dto.DashboardDataDto;
import com.shed.teamden.dashboard.dto.PriorityTaskDto;
import com.shed.teamden.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/data")
    public ResponseEntity<DashboardDataDto> getDashboardData() {
        return ResponseEntity.ok(dashboardService.getDashboardData());
    }

    @PatchMapping("/tasks/{id}/toggle")
    public ResponseEntity<PriorityTaskDto> toggleTask(@PathVariable String id) {
        PriorityTaskDto toggled = dashboardService.toggleTask(id);
        if (toggled == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toggled);
    }

    @PostMapping("/tasks")
    public ResponseEntity<PriorityTaskDto> addTask(@RequestBody Map<String, String> payload) {
        String column = payload.getOrDefault("column", "NOW");
        String title = payload.get("title");
        String tag = payload.getOrDefault("tag", "General");
        return ResponseEntity.ok(dashboardService.addTask(column, title, tag));
    }
}
