package com.shed.teamden.dashboard.controller;

import com.shed.teamden.common.response.ApiResponse;
import com.shed.teamden.dashboard.dto.DashboardDataDto;
import com.shed.teamden.dashboard.dto.MoveTaskRequestDto;
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

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardSummary() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboardSummary()));
    }

    @PatchMapping("/tasks/{id}/toggle")
    public ResponseEntity<PriorityTaskDto> toggleTask(@PathVariable String id) {
        PriorityTaskDto toggled = dashboardService.toggleTask(id);
        if (toggled == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toggled);
    }

    @PatchMapping("/tasks/{id}/move")
    public ResponseEntity<PriorityTaskDto> moveTask(
            @PathVariable String id,
            @RequestBody MoveTaskRequestDto request) {
        PriorityTaskDto moved = dashboardService.moveTask(id, request);
        if (moved == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(moved);
    }

    @PostMapping("/tasks")
    public ResponseEntity<PriorityTaskDto> addTask(@RequestBody Map<String, String> payload) {
        String column = payload.getOrDefault("column", "NOW");
        String title = payload.get("title");
        String tag = payload.getOrDefault("tag", "General");
        String projectId = payload.get("projectId");
        return ResponseEntity.ok(dashboardService.addTask(column, title, tag, projectId));
    }
}
