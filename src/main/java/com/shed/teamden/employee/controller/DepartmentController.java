package com.shed.teamden.employee.controller;

import com.shed.teamden.employee.dto.CreateDepartmentRequestDto;
import com.shed.teamden.employee.dto.DepartmentDto;
import com.shed.teamden.employee.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<DepartmentDto>> getDepartments() {
        return ResponseEntity.ok(employeeService.getDepartments());
    }

    @PostMapping
    public ResponseEntity<DepartmentDto> createDepartment(@Valid @RequestBody CreateDepartmentRequestDto req) {
        DepartmentDto created = employeeService.createDepartment(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
