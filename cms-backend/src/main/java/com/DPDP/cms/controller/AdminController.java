package com.DPDP.cms.controller;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.ConsentArtifact; // Added for cascade revocation
import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.Fiduciary;
//import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository; // Added for cascade revocation
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.FiduciaryRepository;
//import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.DPDP.cms.entity.Tenant;
import com.DPDP.cms.repository.TenantRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {

    private final PurposeRepository purposeRepo;
    private final AuditLogRepository auditLogRepo;
   // private final PurposeRepository purposeRepo;
    private final UserRepository userRepo;
    private final FiduciaryRepository fiduciaryRepo;
    private final TenantRepository tenantRepo;
    private final ConsentArtifactRepository consentRepo;
    private final NotificationLogRepository notificationRepo;
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

    @GetMapping("/purposes")
    public ResponseEntity<List<Purpose>> getPublicPurposes() {
        // Fetch only ACTIVE purposes for the users to see on the Consent Form
        List<Purpose> activePurposes = purposeRepo.findAll().stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive())
                .collect(Collectors.toList());
        return ResponseEntity.ok(activePurposes);
    }

    // --- JOURNEY 5: PURPOSE MANAGEMENT ---
    // Endpoint: /api/admin/purposes
    @GetMapping("/admin/purposes")
    public ResponseEntity<List<Purpose>> getAllPurposes() {
        // SOFT READ: Only fetch purposes where isActive is true for the Admin Dashboard
        List<Purpose> activePurposes = purposeRepo.findAll().stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive())
                .collect(Collectors.toList());
        return ResponseEntity.ok(activePurposes);
    }


    @PostMapping("/admin/purposes")
    public ResponseEntity<Purpose> createPurpose(@RequestBody Purpose purpose) {
        purpose.setIsActive(true);
        // Fallback safeguard: if the frontend sends a null duration, default to 6
        if (purpose.getRetentionPeriodMonths() == null) {
            purpose.setRetentionPeriodMonths(6);
        }
        return ResponseEntity.ok(purposeRepo.save(purpose));
    }

    @PutMapping("/admin/purposes/{id}")
    public ResponseEntity<Purpose> updatePurpose(@PathVariable Long id, @RequestBody Purpose purposeDetails) {
        Purpose purpose = purposeRepo.findById(id).orElseThrow(() -> new RuntimeException("Purpose not found"));
        purpose.setName(purposeDetails.getName());
        purpose.setDescription(purposeDetails.getDescription());
        // FIXED: Now properly updates the mandatory flag and the new retention period
        purpose.setMandatory(purposeDetails.getMandatory());
        purpose.setRetentionPeriodMonths(purposeDetails.getRetentionPeriodMonths());

        return ResponseEntity.ok(purposeRepo.save(purpose));
    }

    @DeleteMapping("/admin/purposes/{id}")
    public ResponseEntity<Void> deletePurpose(@PathVariable Long id) {
        // 1. SOFT DELETE: Instead of destroying the row, we just turn it off!
        Purpose purpose = purposeRepo.findById(id).orElseThrow(() -> new RuntimeException("Purpose not found"));
        purpose.setIsActive(false);
        purposeRepo.save(purpose);

        // 2. CASCADE REVOCATION: Legally invalidate all active consents tied to this retired purpose.
        // This ensures downstream fiduciary microservices can no longer process data for this reason.
        List<ConsentArtifact> activeConsents = consentRepo.findByPurposeIdAndStatus(id, ConsentArtifact.ConsentStatus.ACTIVE);

        for (ConsentArtifact consent : activeConsents) {
            // FIXED: Set the status using the newly defined Enum
            consent.setStatus(ConsentArtifact.ConsentStatus.REVOKED_BY_SYSTEM);
        }

        // Save the revoked artifacts back to the database
        consentRepo.saveAll(activeConsents);

        return ResponseEntity.noContent().build();
    }

    // --- JOURNEY 5: USER MANAGEMENT ---
    // Endpoint: /api/admin/users
    @GetMapping("/admin/users")
    public ResponseEntity<List<String>> getUniqueUsers() {
        // Extracts unique Auth0 Sub IDs from the Audit Logs to populate the Data Principal Directory
        List<String> uniqueUsers = auditLogRepo.findAll().stream()
                .map(AuditLog::getUserId)
                .distinct()
                .collect(Collectors.toList());
        return ResponseEntity.ok(uniqueUsers);
    }

    // --- JOURNEY 6: NOTIFICATION TELEMETRY ---
    // Endpoint: /api/admin/notifications
    @GetMapping("/admin/notifications")
    public ResponseEntity<List<NotificationLog>> getNotifications() {
        // We use the custom method we defined in the repository to automatically sort them by newest first!
        return ResponseEntity.ok(notificationRepo.findAllByOrderByTimestampDesc());
    }
}