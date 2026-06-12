package com.DPDP.cms.controller;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {

    private final AuditLogRepository auditLogRepo;

    // For the General User Dashboard - Journey 1
    @GetMapping("/fiduciaries")
    public List<Map<String, String>> getFiduciaries() {
        // In a full app, this comes from the 'tenants' table. Hardcoded for MVP UI speed.
        return List.of(
                Map.of("id", "TENANT_A", "name", "Alpha Corp (Marketing)"),
                Map.of("id", "TENANT_B", "name", "Beta LLC (Finance)")
        );
    }

    // For the Platform Admin Dashboard - Journey 4 & 5
    @GetMapping("/admin/audit-logs")
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepo.findAll();
    }
}