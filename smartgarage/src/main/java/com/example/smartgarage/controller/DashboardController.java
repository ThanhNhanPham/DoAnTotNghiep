package com.example.smartgarage.controller;

import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {
    private final DashboardService dashboardService;
    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/status")
    public ResponseEntity<DashboardStatusDTO> getDashboardStatus() {
        DashboardStatusDTO status = dashboardService.getDashboardStatus();
        return ResponseEntity.ok(status);
    }
}
