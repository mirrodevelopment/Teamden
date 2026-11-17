package com.shed.teamden.search.controller;

import com.shed.teamden.search.dto.GlobalSearchResponseDto;
import com.shed.teamden.search.service.GlobalSearchService;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping
    public ResponseEntity<GlobalSearchResponseDto> search(
        @RequestParam(value = "q", defaultValue = "") String query,
        @RequestParam(value = "category", defaultValue = "ALL") String category,
        @RequestParam(value = "limit", defaultValue = "20") int limit
    ) {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        String cat = category.toUpperCase();
        GlobalSearchResponseDto result = globalSearchService.search(orgId, query, cat, limit);
        return ResponseEntity.ok(result);
    }
}
