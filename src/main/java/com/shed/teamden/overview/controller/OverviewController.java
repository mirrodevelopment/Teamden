package com.shed.teamden.overview.controller;

import com.shed.teamden.overview.dto.InsightsDataDto;
import com.shed.teamden.overview.dto.OverviewDataDto;
import com.shed.teamden.overview.service.OverviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OverviewController {

    private final OverviewService overviewService;

    @GetMapping("/overview/data")
    public ResponseEntity<OverviewDataDto> getOverviewData() {
        return ResponseEntity.ok(overviewService.getOverviewData());
    }

    @GetMapping("/insights/data")
    public ResponseEntity<InsightsDataDto> getInsightsData() {
        return ResponseEntity.ok(overviewService.getInsightsData());
    }
}
