package com.shed.teamden.project.controller;

import com.shed.teamden.project.dto.*;
import com.shed.teamden.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping("/options")
    public ResponseEntity<ProjectOptionsDto> getProjectOptions() {
        return ResponseEntity.ok(projectService.getProjectOptions());
    }

    @GetMapping("/data")
    public ResponseEntity<ProjectDashboardDto> getProjectDashboardData() {
        return ResponseEntity.ok(projectService.getProjectDashboardData());
    }

    @GetMapping("/{id}/overview")
    public ResponseEntity<ProjectOverviewDto> getProjectOverview(@PathVariable("id") String id) {
        return ResponseEntity.ok(projectService.getProjectOverview(id));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<ProjectTasksDto> getProjectTasks(@PathVariable("id") String id) {
        return ResponseEntity.ok(projectService.getProjectTasks(id));
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<ProjectDocumentsDto> getProjectDocuments(@PathVariable("id") String id) {
        return ResponseEntity.ok(projectService.getProjectDocuments(id));
    }

    @GetMapping("/{id}/activity")
    public ResponseEntity<ProjectActivityDto> getProjectActivity(@PathVariable("id") String id) {
        return ResponseEntity.ok(projectService.getProjectActivity(id));
    }

    @PostMapping
    public ResponseEntity<ProjectItemDto> createProject(@RequestBody CreateProjectRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }
}
