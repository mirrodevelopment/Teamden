package com.shed.teamden.dev.controller;

import com.shed.teamden.auth.dto.AuthResponse;
import com.shed.teamden.common.response.ApiResponse;
import com.shed.teamden.dev.dto.DevOverviewDto;
import com.shed.teamden.dev.dto.DevUserDto;
import com.shed.teamden.dev.dto.TableDataDto;
import com.shed.teamden.dev.dto.TableMetadataDto;
import com.shed.teamden.dev.service.DevPortalService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS})
public class DevPortalController {

    private final DevPortalService devPortalService;

    @GetMapping("/tables")
    public ResponseEntity<ApiResponse<List<TableMetadataDto>>> getTables() {
        return ResponseEntity.ok(ApiResponse.success("Database tables and columns retrieved successfully", devPortalService.getAllTablesWithColumns()));
    }

    @GetMapping("/tables/{tableName}/data")
    public ResponseEntity<ApiResponse<TableDataDto>> getTableData(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "50") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success("Table data retrieved successfully", devPortalService.getTableData(tableName, limit)));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<DevUserDto>>> getDevUsers() {
        return ResponseEntity.ok(ApiResponse.success("Developer user accounts retrieved successfully", devPortalService.getDevUsers()));
    }

    @PostMapping("/login-as/{userId}")
    public ResponseEntity<ApiResponse<AuthResponse>> loginAsUser(
            @PathVariable UUID userId,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = devPortalService.loginAsUser(userId, request, response);
        return ResponseEntity.ok(ApiResponse.success("Authenticated successfully as " + authResponse.getUser().getFullName(), authResponse));
    }

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<DevOverviewDto>> getDevOverview() {
        return ResponseEntity.ok(ApiResponse.success("Database overview retrieved successfully", devPortalService.getDevOverview()));
    }
}
