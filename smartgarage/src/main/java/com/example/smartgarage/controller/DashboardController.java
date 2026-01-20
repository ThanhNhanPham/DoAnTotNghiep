package com.example.smartgarage.controller;

import com.example.smartgarage.dto.DashboardStatusDTO;
import com.example.smartgarage.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {
    @Autowired
    private DashboardService dashboardService;
    @GetMapping("/stats")
    public ResponseEntity<DashboardStatusDTO> getDashboardStats() {
        DashboardStatusDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
