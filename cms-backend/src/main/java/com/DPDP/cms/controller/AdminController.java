package com.DPDP.cms.controller;

import com.DPDP.cms.dto.FiduciaryDto;
import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.Tenant;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.PendingRoleAssignmentRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.TenantRepository;
import com.DPDP.cms.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    private final PendingRoleAssignmentRepository pendingRepo;

    @GetMapping("/fiduciaries")
    public List<FiduciaryDto> getPublicFiduciaries() {
        return tenantRepo.findAll()
                .stream()
                .filter(t -> t.getIsActive() != null && t.getIsActive())
                .map(t -> {
                    long purposeCount = purposeRepo.findByTenantId(t.getId())
                            .stream()
                            .filter(p -> p.getIsActive() != null && p.getIsActive())
                            .count();

                    return new FiduciaryDto(
                            t.getId(),
                            t.getId(),
                            t.getName(),
                            purposeCount
                    );
                })
                .toList();
    }

    @GetMapping("/admin/fiduciaries")
    public List<Map<String, Object>> getAllFiduciaries() {
        return tenantRepo.findAll().stream()
                .filter(t -> t.getIsActive() != null && t.getIsActive())
                .map(t -> {
                    String adminEmail = userRepo
                            .findFirstByTenantIdAndRole(t.getId(), "FIDUCIARY_ADMIN")
                            .map(User::getEmail)
                            .orElse(null);

                    return Map.<String, Object>of(
                            "id", t.getId(),
                            "name", t.getName(),
                            "isActive", t.getIsActive(),
                            "createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "",
                            "fiduciaryAdminEmail", adminEmail != null ? adminEmail : ""
                    );
                })
                .collect(Collectors.toList());
    }

    @PostMapping("/admin/fiduciaries")
    public ResponseEntity<?> createFiduciary(@RequestBody Map<String, String> payload) {
        String newTenantId = payload.get("tenantId");

        if (tenantRepo.existsById(newTenantId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "A company or historical record with this Tenant ID already exists. Please use a unique ID."));
        }

        Tenant tenant = new Tenant();
        tenant.setId(newTenantId);
        tenant.setName(payload.get("name"));
        tenant.setIsActive(true);
        tenantRepo.save(tenant);

        List<Purpose> defaultPurposes = List.of(
                Purpose.builder()
                        .tenantId(newTenantId)
                        .name("Core Service Delivery")
                        .description("Essential data required to provide the core application functionality.")
                        .isActive(true)
                        .mandatory(true)
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
            Tenant tenant = tenantRepo.findById(id)
                    .orElseThrow(() -> new RuntimeException("Company not found"));
            tenant.setIsActive(false);
            tenantRepo.save(tenant);

            List<Purpose> purposes = purposeRepo.findByTenantId(id);
            for (Purpose p : purposes) {
                p.setIsActive(false);
            }
            purposeRepo.saveAll(purposes);

            List<ConsentArtifact> activeConsents = consentRepo.findByTenantIdAndStatus(
                    id, ConsentArtifact.ConsentStatus.ACTIVE);

            for (ConsentArtifact consent : activeConsents) {
                consent.setStatus(ConsentArtifact.ConsentStatus.REVOKED_BY_SYSTEM);
            }
            consentRepo.saveAll(activeConsents);

            List<User> companyUsers = userRepo.findByTenantId(id);
            for (User user : companyUsers) {
                if ("FIDUCIARY_ADMIN".equals(user.getRole()) || "FIDUCIARY_WORKER".equals(user.getRole())) {
                    user.setRole("GENERAL_USER");
                    user.setTenantId(null);
                }
            }
            userRepo.saveAll(companyUsers);
            pendingRepo.deleteByTenantId(id);

            return ResponseEntity.ok(Map.of("message", "Company deactivated. Fiduciary admins and workers were reset to general users."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to deactivate company: " + e.getMessage()));
        }
    }

    @GetMapping("/purposes/{tenantId}")
    public ResponseEntity<List<Purpose>> getPublicPurposesByTenant(@PathVariable String tenantId) {
        List<Purpose> activePurposes = purposeRepo.findByTenantId(tenantId).stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive())
                .collect(Collectors.toList());

        return ResponseEntity.ok(activePurposes);
    }

    @GetMapping("/admin/purposes")
    public ResponseEntity<List<Purpose>> getAllPurposes() {
        List<Purpose> activePurposes = purposeRepo.findAll().stream()
                .filter(p -> p.getIsActive() != null && p.getIsActive())
                .collect(Collectors.toList());
        return ResponseEntity.ok(activePurposes);
    }

    @PostMapping("/admin/purposes")
    public ResponseEntity<Purpose> createPurpose(@RequestBody Purpose purpose) {
        purpose.setIsActive(true);
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
        purpose.setMandatory(purposeDetails.getMandatory());
        purpose.setRetentionPeriodMonths(purposeDetails.getRetentionPeriodMonths());

        return ResponseEntity.ok(purposeRepo.save(purpose));
    }

    @DeleteMapping("/admin/purposes/{id}")
    public ResponseEntity<Void> deletePurpose(@PathVariable Long id) {
        Purpose purpose = purposeRepo.findById(id).orElseThrow(() -> new RuntimeException("Purpose not found"));
        purpose.setIsActive(false);
        purposeRepo.save(purpose);

        List<ConsentArtifact> activeConsents = consentRepo.findByPurposeIdAndStatus(
                id, ConsentArtifact.ConsentStatus.ACTIVE);

        for (ConsentArtifact consent : activeConsents) {
            consent.setStatus(ConsentArtifact.ConsentStatus.REVOKED_BY_SYSTEM);
        }

        consentRepo.saveAll(activeConsents);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<Map<String, String>>> getUniqueUsers() {
        List<Map<String, String>> userList = userRepo.findAll().stream()
                .map(user -> Map.of(
                        "id", user.getId(),
                        "email", user.getEmail() != null ? user.getEmail() : "Email not provided",
                        "role", user.getRole() != null ? user.getRole() : "GENERAL_USER",
                        "tenantId", user.getTenantId() != null ? user.getTenantId() : ""
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(userList);
    }

    @GetMapping("/admin/notifications")
    public ResponseEntity<List<NotificationLog>> getNotifications() {
        return ResponseEntity.ok(notificationRepo.findAllByOrderByTimestampDesc());
    }
}
