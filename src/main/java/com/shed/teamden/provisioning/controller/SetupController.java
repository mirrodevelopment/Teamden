package com.shed.teamden.provisioning.controller;

import com.shed.teamden.common.response.ApiResponse;
import com.shed.teamden.provisioning.dto.CompleteRegistrationRequestDto;
import com.shed.teamden.provisioning.dto.SetupRequest;
import com.shed.teamden.provisioning.dto.SetupStatusResponse;
import com.shed.teamden.provisioning.dto.VerificationCodeRequestDto;
import com.shed.teamden.provisioning.dto.VerifyCodeRequestDto;
import com.shed.teamden.provisioning.service.SetupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    @PostMapping("/send-verification-code")
    public ResponseEntity<ApiResponse<Map<String, String>>> sendVerificationCode(@Valid @RequestBody VerificationCodeRequestDto request) {
        Map<String, String> result = setupService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Verification code sent successfully", result));
    }

    @PostMapping("/verify-code")
    public ResponseEntity<ApiResponse<Boolean>> verifyCode(@Valid @RequestBody VerifyCodeRequestDto request) {
        boolean verified = setupService.verifyCode(request.getEmail(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", verified));
    }

    @PostMapping("/register-company")
    public ResponseEntity<ApiResponse<Void>> registerCompany(@Valid @RequestBody CompleteRegistrationRequestDto request) {
        setupService.registerCompany(request);
        return ResponseEntity.ok(ApiResponse.success("Company workspace and owner account registered successfully", null));
    }
}
