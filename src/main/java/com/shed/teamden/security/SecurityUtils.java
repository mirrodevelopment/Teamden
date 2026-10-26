package com.shed.teamden.security;

import com.shed.teamden.common.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {

    private SecurityUtils() {}

    public static Optional<CustomUserDetails> getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof CustomUserDetails) {
            return Optional.of((CustomUserDetails) authentication.getPrincipal());
        }
        return Optional.empty();
    }

    public static CustomUserDetails getRequiredAuthenticatedUser() {
        return getAuthenticatedUser().orElseThrow(() -> new UnauthorizedException("User is not authenticated"));
    }
}
