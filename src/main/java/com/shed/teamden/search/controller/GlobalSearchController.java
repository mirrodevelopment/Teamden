package com.shed.teamden.search.controller;

import com.shed.teamden.search.dto.ConnectedContextDto;
import com.shed.teamden.search.dto.GlobalSearchResponseDto;
import com.shed.teamden.search.dto.SavedSearchDto;
import com.shed.teamden.search.service.GlobalSearchService;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
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
        @RequestParam(value = "sort", defaultValue = "best_match") String sort,
        @RequestParam(value = "status", required = false) String status,
        @RequestParam(value = "projectId", required = false) UUID projectId,
        @RequestParam(value = "priority", required = false) String priority,
        @RequestParam(value = "limit", defaultValue = "30") int limit
    ) {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        GlobalSearchResponseDto result = globalSearchService.search(orgId, query, category, sort, status, projectId, priority, limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/context")
    public ResponseEntity<ConnectedContextDto> getConnectedContext(
        @RequestParam(value = "type", defaultValue = "TASK") String type,
        @RequestParam(value = "id", required = false) UUID id
    ) {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        ConnectedContextDto context = globalSearchService.getConnectedContext(orgId, type, id);
        return ResponseEntity.ok(context);
    }

    @GetMapping("/saved")
    public ResponseEntity<List<SavedSearchDto>> getSavedSearches() {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(globalSearchService.getSavedSearches(orgId));
    }

    @PostMapping("/saved")
    public ResponseEntity<SavedSearchDto> saveSearch(@RequestBody Map<String, String> body) {
        CustomUserDetails user = SecurityUtils.getRequiredAuthenticatedUser();
        UUID orgId = user.getActiveOrganizationId();
        if (orgId == null) {
            return ResponseEntity.badRequest().build();
        }
        String name = body.getOrDefault("name", "Saved Search");
        String query = body.getOrDefault("query", "");
        String category = body.getOrDefault("category", "ALL");
        SavedSearchDto saved = globalSearchService.saveSearch(orgId, name, query, category);
        return ResponseEntity.ok(saved);
    }
}
