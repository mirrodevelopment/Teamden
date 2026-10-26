package com.shed.teamden.provisioning.controller;

import com.shed.teamden.common.response.ApiResponse;
import com.shed.teamden.provisioning.dto.SetupRequest;
import com.shed.teamden.provisioning.dto.SetupStatusResponse;
import com.shed.teamden.provisioning.service.SetupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/setup")
@RequiredArgsConstructor
public class SetupController {

    private final SetupService setupService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<SetupStatusResponse>> getStatus() {
        return ResponseEntity.ok(ApiResponse.success(setupService.getSetupStatus()));
    }

    @PostMapping("/initialize")
    public ResponseEntity<ApiResponse<Void>> initializeWorkspace(@Valid @RequestBody SetupRequest request) {
        setupService.provisionInitialWorkspace(request);
        return ResponseEntity.ok(ApiResponse.success("Initial workspace and owner account provisioned successfully", null));
    }
}
