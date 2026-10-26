package com.shed.teamden.dashboard.controller;

import com.shed.teamden.common.response.ApiResponse;
import com.shed.teamden.dashboard.dto.*;
import com.shed.teamden.dashboard.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getSummary() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<KpiMetricsDto>> getMetrics() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary.getKpis()));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<ApiResponse<List<TaskItemDto>>> getMyTasks() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary.getMyTasks()));
    }

    @GetMapping("/projects")
    public ResponseEntity<ApiResponse<List<ProjectItemDto>>> getProjects() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary.getProjects()));
    }

    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<List<ActivityItemDto>>> getActivity() {
        DashboardSummaryDto summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success(summary.getRecentActivity()));
    }

    @org.springframework.web.bind.annotation.PostMapping("/projects")
    public ResponseEntity<ApiResponse<ProjectItemDto>> createProject(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody CreateProjectRequest request
    ) {
        ProjectItemDto project = dashboardService.createProject(request);
        return ResponseEntity.ok(ApiResponse.success("Project created successfully", project));
    }

    @org.springframework.web.bind.annotation.PostMapping("/tasks")
    public ResponseEntity<ApiResponse<TaskItemDto>> createTask(
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody CreateTaskRequest request
    ) {
        TaskItemDto task = dashboardService.createTask(request);
        return ResponseEntity.ok(ApiResponse.success("Task created successfully", task));
    }

    @org.springframework.web.bind.annotation.PostMapping({"/attendance/punch", "/attendance/toggle"})
    public ResponseEntity<ApiResponse<AttendanceSummaryDto>> punchAttendance() {
        AttendanceSummaryDto attendance = dashboardService.toggleAttendance();
        return ResponseEntity.ok(ApiResponse.success("Attendance updated successfully", attendance));
    }
}
