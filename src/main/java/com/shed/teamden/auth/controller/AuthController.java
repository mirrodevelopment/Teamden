package com.shed.teamden.auth.controller;

import com.shed.teamden.auth.dto.AuthResponse;
import com.shed.teamden.auth.dto.CsrfResponse;
import com.shed.teamden.auth.dto.LoginRequest;
import com.shed.teamden.auth.dto.UserProfileDto;
import com.shed.teamden.auth.service.AuthService;
import com.shed.teamden.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        AuthResponse response = authService.login(request, httpRequest, httpResponse);
        return ResponseEntity.ok(ApiResponse.success("Authentication successful", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDto>> getCurrentUser() {
        UserProfileDto profile = authService.getCurrentUserProfile();
        return ResponseEntity.ok(ApiResponse.success(profile));
    }

    @GetMapping("/csrf")
    public ResponseEntity<ApiResponse<CsrfResponse>> getCsrfToken(HttpServletRequest request) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken == null) {
            csrfToken = (CsrfToken) request.getAttribute("_csrf");
        }
        if (csrfToken != null) {
            CsrfResponse response = CsrfResponse.builder()
                    .token(csrfToken.getToken())
                    .headerName(csrfToken.getHeaderName())
                    .parameterName(csrfToken.getParameterName())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(response));
        }
        return ResponseEntity.ok(ApiResponse.success(new CsrfResponse()));
    }
}
