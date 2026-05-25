package com.footyiq.api.controller;

import com.footyiq.api.model.DashboardSnapshot;
import com.footyiq.api.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSnapshot getSummary() {
        return dashboardService.getLatest();
    }

    @PostMapping("/refresh")
    public DashboardSnapshot refresh() {
        return dashboardService.refreshFromScraper();
    }
}
