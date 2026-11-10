package com.shed.teamden.task.controller;

import com.shed.teamden.dashboard.dto.PriorityTaskDto;
import com.shed.teamden.task.dto.CreateTaskRequestDto;
import com.shed.teamden.task.dto.TaskOptionsDto;
import com.shed.teamden.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<PriorityTaskDto> createTask(@RequestBody CreateTaskRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request));
    }

    @GetMapping("/options")
    public ResponseEntity<TaskOptionsDto> getTaskOptions() {
        return ResponseEntity.ok(taskService.getTaskOptions());
    }

    @GetMapping
    public ResponseEntity<List<PriorityTaskDto>> getTasks(@RequestParam(value = "column", required = false) String column) {
        return ResponseEntity.ok(taskService.getTasks(column));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PriorityTaskDto> getTaskById(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }
}
