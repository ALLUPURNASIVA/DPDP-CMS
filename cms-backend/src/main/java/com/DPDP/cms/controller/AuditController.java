package com.DPDP.cms.controller;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepo;

    // Endpoint: /api/admin/logs
    @GetMapping("/logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs() {
        List<AuditLog> logs = auditLogRepo.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
        return ResponseEntity.ok(logs);
    }
}