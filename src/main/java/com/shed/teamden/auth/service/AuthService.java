package com.shed.teamden.auth.service;

import com.shed.teamden.auth.dto.AuthResponse;
import com.shed.teamden.auth.dto.LoginRequest;
import com.shed.teamden.auth.dto.UserProfileDto;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final UserRepository userRepository;

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        log.info("Processing login request for email: {}", normalizedEmail);

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
            );

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

            // Update last login timestamp in database
            userRepository.findById(userDetails.getId()).ifPresent(u -> {
                u.setLastLoginAt(Instant.now());
                userRepository.save(u);
            });

            UserProfileDto profile = UserProfileDto.builder()
                    .id(userDetails.getId())
                    .fullName(userDetails.getFullName())
                    .email(userDetails.getEmail())
                    .status(userDetails.getStatus())
                    .activeOrganizationId(userDetails.getActiveOrganizationId())
                    .activeOrganizationName(userDetails.getActiveOrganizationName())
                    .role(userDetails.getActiveRole())
                    .initials(UserProfileDto.computeInitials(userDetails.getFullName()))
                    .build();

            log.info("User {} successfully authenticated in org {}", userDetails.getId(), userDetails.getActiveOrganizationId());
            return AuthResponse.builder()
                    .authenticated(true)
                    .user(profile)
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("Invalid credentials for email: {}", normalizedEmail);
            throw new BadCredentialsException("Invalid email or password");
        }
    }

    @Transactional(readOnly = true)
    public UserProfileDto getCurrentUserProfile() {
        CustomUserDetails userDetails = SecurityUtils.getRequiredAuthenticatedUser();

        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new UnauthorizedException("User record not found"));

        return UserProfileDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .status(user.getStatus())
                .activeOrganizationId(userDetails.getActiveOrganizationId())
                .activeOrganizationName(userDetails.getActiveOrganizationName())
                .role(userDetails.getActiveRole())
                .initials(UserProfileDto.computeInitials(user.getFullName()))
                .build();
    }
}
