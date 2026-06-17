package com.DPDP.cms.controller;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.Fiduciary;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.FiduciaryRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.DPDP.cms.entity.Tenant;
import com.DPDP.cms.repository.TenantRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {

    private final AuditLogRepository auditLogRepo;
    private final PurposeRepository purposeRepo;
    private final UserRepository userRepo;
    private final FiduciaryRepository fiduciaryRepo;
    private final TenantRepository tenantRepo;
    // =====================================================
    // Journey 1 - Fiduciary Companies
    // =====================================================

    @GetMapping("/fiduciaries")
    public List<Fiduciary> getFiduciaries() {
        return fiduciaryRepo.findAll();
    }

    // =====================================================
    // Company Management
    // =====================================================

    @GetMapping("/admin/fiduciaries")
    public List<Fiduciary> getAllFiduciaries() {
        return fiduciaryRepo.findAll();
    }

   @PostMapping("/admin/fiduciaries")
public Fiduciary createFiduciary(
        @RequestBody Fiduciary fiduciary) {

    Fiduciary saved =
            fiduciaryRepo.save(fiduciary);

    Tenant tenant = new Tenant();

    tenant.setId(saved.getTenantId());
    tenant.setName(saved.getName());

    tenantRepo.save(tenant);

    return saved;
}

    @PutMapping("/admin/fiduciaries/{id}")
    public Fiduciary updateFiduciary(
            @PathVariable Long id,
            @RequestBody Fiduciary updated) {

        Fiduciary fiduciary = fiduciaryRepo.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Company not found"));

        fiduciary.setTenantId(updated.getTenantId());
        fiduciary.setName(updated.getName());

        return fiduciaryRepo.save(fiduciary);
    }

    @DeleteMapping("/admin/fiduciaries/{id}")
public ResponseEntity<?> deleteFiduciary(
        @PathVariable Long id) {

    Fiduciary fiduciary = fiduciaryRepo.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("Company not found"));

    String tenantId = fiduciary.getTenantId();

    // 1. Delete purposes
    purposeRepo.deleteByTenantId(tenantId);

    // 2. Delete tenant
    tenantRepo.deleteById(tenantId);

    // 3. Delete company
    fiduciaryRepo.deleteById(id);

    return ResponseEntity.ok(
            Map.of("message", "Company deleted successfully")
    );
}

    // =====================================================
    // Purpose Management
    // =====================================================

   @PostMapping("/admin/purposes")
public ResponseEntity<?> createPurpose(
        @RequestBody Purpose purpose) {

    try {

        System.out.println("TENANT = " + purpose.getTenantId());
        System.out.println("NAME = " + purpose.getName());
        System.out.println("DESC = " + purpose.getDescription());

        Purpose saved = purposeRepo.save(purpose);

        return ResponseEntity.ok(saved);

    } catch (Exception e) {

        e.printStackTrace();

        return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
    }
}
    @GetMapping("/admin/purposes")
    public List<Purpose> getAllPurposes() {
        return purposeRepo.findAll();
    }

    @PutMapping("/admin/purposes/{id}")
    public ResponseEntity<?> updatePurpose(
            @PathVariable Long id,
            @RequestBody Purpose updatedPurpose) {

        Purpose purpose = purposeRepo.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Purpose not found"));

        purpose.setTenantId(updatedPurpose.getTenantId());
        purpose.setName(updatedPurpose.getName());
        purpose.setDescription(updatedPurpose.getDescription());
        purpose.setMandatory(updatedPurpose.isMandatory());

        Purpose saved = purposeRepo.save(purpose);

        return ResponseEntity.ok(
                Map.of(
                        "message", "Purpose updated",
                        "id", saved.getId()
                )
        );
    }

    // =====================================================
    // User Management
    // =====================================================

    @GetMapping("/admin/users")
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }

    // =====================================================
    // Notification Status
    // =====================================================

    @GetMapping("/admin/notifications")
    public List<AuditLog> getNotificationStatus() {
        return auditLogRepo.findAll();
    }

    // =====================================================
    // Audit Logs
    // =====================================================

    @GetMapping("/admin/audit-logs")
    public List<AuditLog> getAllAuditLogs() {
        return auditLogRepo.findAll();
    }
}