package com.shed.teamden.project.controller;

import com.shed.teamden.project.dto.CreateProjectRequestDto;
import com.shed.teamden.project.dto.ProjectDashboardDto;
import com.shed.teamden.project.dto.ProjectItemDto;
import com.shed.teamden.project.dto.ProjectOverviewDto;
import com.shed.teamden.project.dto.ProjectTasksDto;
import com.shed.teamden.project.dto.ProjectDocumentsDto;
import com.shed.teamden.project.dto.ProjectActivityDto;
import com.shed.teamden.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

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
        return ResponseEntity.ok(projectService.createProject(request));
    }
}
