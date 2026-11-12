package com.shed.teamden.project.controller;

import com.shed.teamden.project.dto.CreateMilestoneRequestDto;
import com.shed.teamden.project.dto.ProjectMilestoneDto;
import com.shed.teamden.project.dto.UpdateMilestoneRequestDto;
import com.shed.teamden.project.service.ProjectMilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/milestones")
@RequiredArgsConstructor
public class ProjectMilestoneController {

    private final ProjectMilestoneService projectMilestoneService;

    @GetMapping
    public ResponseEntity<List<ProjectMilestoneDto>> getProjectMilestones(@PathVariable("projectId") UUID projectId) {
        return ResponseEntity.ok(projectMilestoneService.getProjectMilestones(projectId));
    }

    @PostMapping
    public ResponseEntity<ProjectMilestoneDto> createMilestone(
            @PathVariable("projectId") UUID projectId,
            @RequestBody CreateMilestoneRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectMilestoneService.createMilestone(projectId, request));
    }

    @PatchMapping("/{milestoneId}")
    public ResponseEntity<ProjectMilestoneDto> updateMilestone(
            @PathVariable("projectId") UUID projectId,
            @PathVariable("milestoneId") UUID milestoneId,
            @RequestBody UpdateMilestoneRequestDto request) {
        return ResponseEntity.ok(projectMilestoneService.updateMilestone(projectId, milestoneId, request));
    }

    @DeleteMapping("/{milestoneId}")
    public ResponseEntity<Void> deleteMilestone(
            @PathVariable("projectId") UUID projectId,
            @PathVariable("milestoneId") UUID milestoneId) {
        projectMilestoneService.deleteMilestone(projectId, milestoneId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/initialize-template")
    public ResponseEntity<List<ProjectMilestoneDto>> initializeTemplate(@PathVariable("projectId") UUID projectId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectMilestoneService.initializeLifecycleTemplate(projectId));
    }
}
