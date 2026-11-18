package com.shed.teamden.employee.controller;

import com.shed.teamden.employee.dto.*;
import com.shed.teamden.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<EmployeeDirectoryResponseDto> getDirectory(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "role", required = false) String role,
            @RequestParam(name = "activeId", required = false) UUID activeId
    ) {
        return ResponseEntity.ok(employeeService.getDirectory(search, department, role, activeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeDetailDto> getEmployeeDetail(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(employeeService.getEmployeeDetail(id));
    }

    @PostMapping
    public ResponseEntity<EmployeeDto> createEmployee(@Valid @RequestBody CreateEmployeeRequestDto req) {
        EmployeeDto created = employeeService.createEmployee(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/responsibilities")
    public ResponseEntity<EmployeeResponsibilityDto> addResponsibility(
            @PathVariable("id") UUID id,
            @Valid @RequestBody AddResponsibilityRequestDto req
    ) {
        EmployeeResponsibilityDto created = employeeService.addResponsibility(id, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}/responsibilities/{respId}")
    public ResponseEntity<Map<String, Object>> deleteResponsibility(
            @PathVariable("id") UUID id,
            @PathVariable("respId") UUID respId
    ) {
        employeeService.deleteResponsibility(respId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Responsibility deleted"));
    }

    @GetMapping("/roles")
    public ResponseEntity<List<WorkspaceRoleDto>> getRoles() {
        return ResponseEntity.ok(employeeService.getRoles());
    }

    @PostMapping("/roles")
    public ResponseEntity<WorkspaceRoleDto> createRole(@RequestBody WorkspaceRoleDto req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createRole(req));
    }

    @GetMapping("/structure")
    public ResponseEntity<TeamStructureNodeDto> getTeamStructure() {
        return ResponseEntity.ok(employeeService.getTeamStructure());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<EmployeeDto> updateStatus(
            @PathVariable("id") UUID id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.getOrDefault("status", "ACTIVE");
        return ResponseEntity.ok(employeeService.updateEmployeeStatus(id, status));
    }
}
