package com.DPDP.cms.controller;

import com.DPDP.cms.dto.*;
import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.ConsentArtifact; // Added for cascade revocation
import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository; // Added for cascade revocation
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.PurposeRepository;

import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.DPDP.cms.entity.Tenant;
import com.DPDP.cms.repository.TenantRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import jakarta.transaction.Transactional;
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AdminController {

    private final PurposeRepository purposeRepo;
    private final AuditLogRepository auditLogRepo;
    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;
    private final ConsentArtifactRepository consentRepo;
    private final NotificationLogRepository notificationRepo;

    @GetMapping("/fiduciaries")
    public List<FiduciaryDto> getPublicFiduciaries() {

        return tenantRepo.findAll()
                .stream()
                .filter(t -> t.getIsActive() != null && t.getIsActive())
                .map(t -> {

                    long purposeCount =
                            purposeRepo
                                    .findByTenantId(t.getId())
                                    .size();

                    return new FiduciaryDto(
                            t.getId(),      // id
                            t.getId(),      // tenantId
                            t.getName(),    // name
                            purposeCount
                    );

                })
                .toList();
    }

    // =====================================================
    // Company (Tenant) Management
    // =====================================================

    @GetMapping("/admin/fiduciaries")
    public List<Tenant> getAllFiduciaries() {
        return tenantRepo.findAll().stream()
                .filter(t -> t.getIsActive() != null && t.getIsActive())
                .collect(Collectors.toList());
    }

    @PostMapping("/admin/fiduciaries")
    public ResponseEntity<?> createFiduciary(@RequestBody Map<String, String> payload) {
        String newTenantId = payload.get("tenantId");

        // SECURITY CHECK: Prevent overwriting or resurrecting existing records
        if (tenantRepo.existsById(newTenantId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A company or historical record with this Tenant ID already exists. Please use a unique ID."));
        }

        // 1. Create the new Company
        Tenant tenant = new Tenant();
        tenant.setId(newTenantId);
        tenant.setName(payload.get("name"));
        tenantRepo.save(tenant);

        // 2. Automatically generate the default purpose templates
        List<Purpose> defaultPurposes = List.of(
                Purpose.builder()
                        .tenantId(newTenantId)
                        .name("Core Service Delivery")
                        .description("Essential data required to provide the core application functionality.")
                        .isActive(true)
                        .mandatory(true) // Users cannot opt out of this
                        .retentionPeriodMonths(12)
                        .build(),
                Purpose.builder()
                        .tenantId(newTenantId)
                        .name("Marketing & Communications")
                        .description("Receive promotional emails, product updates, and special offers.")
                        .isActive(true)
                        .mandatory(false)
                        .retentionPeriodMonths(3)
                        .build(),
                Purpose.builder()
                        .tenantId(newTenantId)
                        .name("Product Analytics")
                        .description("Allow us to track platform usage to improve the user experience.")
                        .isActive(true)
                        .mandatory(false)
                        .retentionPeriodMonths(6)
                        .build()
        );

        // Save all default purposes to the database at once
        purposeRepo.saveAll(defaultPurposes);

        return ResponseEntity.ok(tenant);
    }

    @PutMapping("/admin/fiduciaries/{id}")
    public Tenant updateFiduciary(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Tenant tenant = tenantRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Company not found"));

        tenant.setName(payload.get("name"));
        return tenantRepo.save(tenant);
    }

    @Transactional
    @DeleteMapping("/admin/fiduciaries/{id}")
    public ResponseEntity<?> deleteFiduciary(@PathVariable String id) {
        try {
            // 1. Soft Delete the Company (Tenant)
            Tenant tenant = tenantRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Company not found"));
            tenant.setIsActive(false);
            tenantRepo.save(tenant);

            // 2. Soft Delete all associated Data Purposes
            // (Assuming you added findByTenantId to PurposeRepository earlier)
            List<Purpose> purposes = purposeRepo.findByTenantId(id);
            for (Purpose p : purposes) {
                p.setIsActive(false);
            }
            purposeRepo.saveAll(purposes);

            // 3. Cascade Revocation: Legally invalidate all active consents
            List<ConsentArtifact> activeConsents = consentRepo.findByTenantIdAndStatus(
                    id, ConsentArtifact.ConsentStatus.ACTIVE);

            for (ConsentArtifact consent : activeConsents) {
                consent.setStatus(ConsentArtifact.ConsentStatus.REVOKED_BY_SYSTEM);
            }
            consentRepo.saveAll(activeConsents);

            return ResponseEntity.ok(Map.of("message", "Company deactivated and all data processing legally halted."));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to deactivate company: " + e.getMessage()));
        }
    }

    // --- JOURNEY 2: PUBLIC USER ENDPOINTS ---
    // Now requires the tenantId in the URL to isolate data!
    @GetMapping("/purposes/{tenantId}")
    public ResponseEntity<List<Purpose>> getPublicPurposesByTenant(@PathVariable String tenantId) {

        // Use the repository method we created earlier to filter by tenant
        List<Purpose> activePurposes = purposeRepo.findByTenantId(tenantId).stream()
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