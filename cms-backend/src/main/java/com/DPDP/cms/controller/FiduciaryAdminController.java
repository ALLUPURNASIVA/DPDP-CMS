package com.DPDP.cms.controller;

import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.FiduciaryWorker;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiduciary")
@RequiredArgsConstructor
public class FiduciaryAdminController {

    private final UserRepository userRepo;
    private final PurposeRepository purposeRepo;
    private final ConsentArtifactRepository consentRepo;
    private final FiduciaryWorkerRepository workerRepo;
    private final ComplaintRepository complaintRepo;

    // --- SECURITY GATEWAY ---
    private String getAuthenticatedTenantId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String auth0Id = jwt.getClaimAsString("sub");
            User user = userRepo.findById(auth0Id)
                    .orElseThrow(() -> new RuntimeException("User profile not found."));

            if (!"FIDUCIARY_ADMIN".equals(user.getRole()) || user.getTenantId() == null) {
                throw new SecurityException("Access Denied: Invalid Fiduciary privileges.");
            }
            return user.getTenantId();
        }
        throw new IllegalStateException("Invalid Authentication");
    }

    // =====================================================
    // 0. VERIFY ACCESS PING (Frontend Gatekeeper)
    // =====================================================
    @GetMapping("/verify")
    public ResponseEntity<?> verifyAccess() {
        String tenantId = getAuthenticatedTenantId();
        return ResponseEntity.ok(Map.of("status", "Authorized", "tenantId", tenantId));
    }

    // =====================================================
    // 1. GET ALL PURPOSES (Filtered by Tenant)
    // =====================================================
    @GetMapping("/purposes")
    public ResponseEntity<List<Purpose>> getCompanyPurposes() {
        String tenantId = getAuthenticatedTenantId();
        List<Purpose> tenantPurposes = purposeRepo.findByTenantId(tenantId);
        return ResponseEntity.ok(tenantPurposes);
    }

    // =====================================================
    // 2. CREATE NEW PURPOSE (Locked to Tenant)
    // =====================================================
    @PostMapping("/purposes")
    public ResponseEntity<Purpose> createCustomPurpose(@RequestBody Purpose newPurpose) {
        String tenantId = getAuthenticatedTenantId();

        newPurpose.setTenantId(tenantId);
        newPurpose.setIsActive(true);

        Purpose savedPurpose = purposeRepo.save(newPurpose);
        return ResponseEntity.ok(savedPurpose);
    }

    // =====================================================
    // 3. EDIT EXISTING PURPOSE (Validates Ownership)
    // =====================================================
    @PutMapping("/purposes/{purposeId}")
    public ResponseEntity<Purpose> updateCustomPurpose(
            @PathVariable Long purposeId,
            @RequestBody Purpose updatedData) {

        String tenantId = getAuthenticatedTenantId();

        Purpose existingPurpose = purposeRepo.findById(purposeId)
                .orElseThrow(() -> new RuntimeException("Purpose not found"));

        if (!existingPurpose.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access Denied: You do not own this purpose.");
        }

        existingPurpose.setName(updatedData.getName());
        existingPurpose.setDescription(updatedData.getDescription());
        existingPurpose.setRetentionPeriodMonths(updatedData.getRetentionPeriodMonths());
        existingPurpose.setMandatory(updatedData.getMandatory());

        Purpose savedPurpose = purposeRepo.save(existingPurpose);
        return ResponseEntity.ok(savedPurpose);
    }

    // =====================================================
    // 4. RETIRE PURPOSE (Soft Delete, Validates Ownership)
    // =====================================================
    @PutMapping("/purposes/{purposeId}/retire")
    public ResponseEntity<?> retirePurpose(@PathVariable Long purposeId) {
        String tenantId = getAuthenticatedTenantId();

        Purpose existingPurpose = purposeRepo.findById(purposeId)
                .orElseThrow(() -> new RuntimeException("Purpose not found"));

        if (!existingPurpose.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access Denied: You do not own this purpose.");
        }

        existingPurpose.setIsActive(false);
        purposeRepo.save(existingPurpose);

        return ResponseEntity.ok(Map.of("message", "Purpose successfully retired"));
    }

    // =====================================================
    // 5. GET ALL CONSENT ARTIFACTS (Enriched with Email)
    // =====================================================
    @GetMapping("/consents")
    public ResponseEntity<List<java.util.Map<String, Object>>> getCompanyConsents() {
        String tenantId = getAuthenticatedTenantId();
        List<ConsentArtifact> consents = consentRepo.findByTenantId(tenantId);
        // NEW: Sort descending by date so the newest records appear at the top of the directory
        consents.sort((a, b) -> b.getGrantedAt().compareTo(a.getGrantedAt()));

        List<java.util.Map<String, Object>> response = consents.stream().map(c -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", c.getId().toString());

            String email = userRepo.findById(c.getUserId())
                    .map(com.DPDP.cms.entity.User::getEmail)
                    .orElse(c.getUserId());

            map.put("userEmail", email);
            map.put("purposeName", c.getPurpose() != null ? c.getPurpose().getName() : "Unknown");
            map.put("status", c.getStatus() != null ? c.getStatus().name() : "UNKNOWN");
            map.put("grantedAt", c.getGrantedAt());
            map.put("expiresAt", c.getExpiresAt());

            return map;
        }).toList();
        return ResponseEntity.ok(response);
    }

    // =====================================================
    // 6. USER 360 CONSENT PROFILE
    // =====================================================
    @GetMapping("/subject-profile")
    public ResponseEntity<java.util.Map<String, Object>> getSubjectProfile(@RequestParam String email) {
        String tenantId = getAuthenticatedTenantId();
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("email", email);

        java.util.Optional<com.DPDP.cms.entity.User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            response.put("found", false);
            return ResponseEntity.ok(response);
        }

        String userId = userOpt.get().getId();
        response.put("found", true);
        response.put("userId", userId);

        List<com.DPDP.cms.entity.Purpose> activePurposes = purposeRepo.findByTenantId(tenantId).stream()
                .filter(p -> p.getIsActive() == null || p.getIsActive())
                .toList();

        List<ConsentArtifact> userConsents = consentRepo.findByUserIdAndTenantId(userId, tenantId);
        // NEW: Sort descending by date so .findFirst() always grabs the most recent record
        userConsents.sort((a, b) -> b.getGrantedAt().compareTo(a.getGrantedAt()));
        List<java.util.Map<String, Object>> matrix = new java.util.ArrayList<>();

        for (com.DPDP.cms.entity.Purpose purpose : activePurposes) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("purposeName", purpose.getName());
            map.put("description", purpose.getDescription());
            map.put("isMandatory", purpose.getMandatory());

            java.util.Optional<ConsentArtifact> artifact = userConsents.stream()
                    .filter(c -> c.getPurpose() != null && c.getPurpose().getId().equals(purpose.getId()))
                    .findFirst();

            if (artifact.isPresent()) {
                ConsentArtifact c = artifact.get();
                map.put("status", c.getStatus() != null ? c.getStatus().name() : "UNKNOWN");
                map.put("grantedAt", c.getGrantedAt());
                map.put("expiresAt", c.getExpiresAt());
                map.put("receiptId", c.getId().toString());
            } else {
                map.put("status", "NEVER_PROVIDED");
            }

            matrix.add(map);
        }

        response.put("profile", matrix);
        return ResponseEntity.ok(response);
    }

    // =====================================================
    // 7. WORKER ACCESS MANAGEMENT
    // =====================================================
    @GetMapping("/workers")
    public ResponseEntity<List<User>> getWorkers() {
        return ResponseEntity.ok(userRepo.findByTenantIdAndRole(getAuthenticatedTenantId(), "FIDUCIARY_WORKER"));
    }

    @PostMapping("/workers")
    public ResponseEntity<?> addWorker(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String tenantId = getAuthenticatedTenantId();

        if (workerRepo.existsByEmailAndTenantId(email, tenantId)) {
            return ResponseEntity.badRequest().body("Worker already authorized.");
        }

        // Standard instantiation to avoid reliance on @Builder definitions
        FiduciaryWorker worker = new FiduciaryWorker();
        worker.setTenantId(tenantId);
        worker.setEmail(email);
        worker.setAddedAt(java.time.LocalDateTime.now());

        return ResponseEntity.ok(workerRepo.save(worker));
    }

    @DeleteMapping("/workers/{id}")
    public ResponseEntity<?> removeWorker(@PathVariable java.util.UUID id) {
        workerRepo.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // =====================================================
    // EXPORT AUDIT REPORT
    // =====================================================
    @GetMapping("/consent/export")
    public ResponseEntity<byte[]> exportConsentData() {
        String tenantId = getAuthenticatedTenantId();
        List<ConsentArtifact> data = consentRepo.findByTenantId(tenantId);

        StringBuilder csv = new StringBuilder("ID,UserEmail,Status,Purpose,GrantedAt,ExpiresAt\n");

        for (ConsentArtifact c : data) {
            String email = userRepo.findById(c.getUserId())
                    .map(User::getEmail)
                    .orElse(c.getUserId());

            csv.append(c.getId()).append(",")
                    .append(email).append(",")
                    .append(c.getStatus() != null ? c.getStatus().name() : "UNKNOWN").append(",")
                    .append(c.getPurpose() != null ? c.getPurpose().getName() : "None").append(",")
                    .append(c.getGrantedAt() != null ? c.getGrantedAt() : "N/A").append(",")
                    .append(c.getExpiresAt() != null ? c.getExpiresAt() : "N/A").append("\n");
        }

        byte[] content = csv.toString().getBytes();

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audit_report.csv")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(content);
    }

    // =====================================================
    // EXECUTIVE ANALYTICS COMMAND CENTER
    // =====================================================
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        String tenantId = getAuthenticatedTenantId();
        Map<String, Object> metrics = new HashMap<>();

        List<ConsentArtifact> allConsents = consentRepo.findByTenantId(tenantId);
        List<Purpose> allPurposes = purposeRepo.findByTenantId(tenantId).stream()
                .filter(p -> p.getIsActive() == null || p.getIsActive())
                .toList();

        // 1. Existing KPIs
        long totalUsers = allConsents.stream().map(ConsentArtifact::getUserId).distinct().count();
        long activeConsents = allConsents.stream().filter(c -> c.getStatus() == ConsentArtifact.ConsentStatus.ACTIVE).count();
        long withdrawnConsents = allConsents.stream().filter(c -> c.getStatus() == ConsentArtifact.ConsentStatus.WITHDRAWN).count();

        metrics.put("activeConsents", activeConsents);
        metrics.put("withdrawnConsents", withdrawnConsents);
        long pendingQueries = complaintRepo.countByTenantIdAndStatus(tenantId, "ESCALATED");
        metrics.put("pendingQueries", pendingQueries);
        metrics.put("totalUsers", totalUsers);
        metrics.put("totalWorkers", userRepo.countByTenantIdAndRole(tenantId, "FIDUCIARY_WORKER"));

        // --- CONSENT ARTIFACT TRENDS (Last 7 Days) ---
        List<Map<String, Object>> activityComparison = new ArrayList<>();
        java.time.LocalDate today = java.time.LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate date = today.minusDays(i);
            java.time.LocalDateTime start = date.atStartOfDay();
            java.time.LocalDateTime end = date.atTime(java.time.LocalTime.MAX);

            // Both use grantedAt, as requested
            long grantedCount = consentRepo.countByTenantIdAndStatusAndGrantedAtBetween(
                    tenantId, ConsentArtifact.ConsentStatus.ACTIVE, start, end);

            long withdrawnCount = consentRepo.countByTenantIdAndStatusAndGrantedAtBetween(
                    tenantId, ConsentArtifact.ConsentStatus.WITHDRAWN, start, end);

            activityComparison.add(Map.of(
                    "day", date.format(java.time.format.DateTimeFormatter.ofPattern("EEE")),
                    "granted", grantedCount,
                    "withdrawn", withdrawnCount
            ));
        }
        metrics.put("activityComparison", activityComparison);

        // 3. Purpose Access Stats (The new "Side Bar Graph" data)
        List<Map<String, Object>> purposeAccessStats = new ArrayList<>();
        long totalUniqueUsers = allConsents.stream().map(ConsentArtifact::getUserId).distinct().count();

        for (Purpose p : allPurposes) {
            long activeCount = allConsents.stream()
                    .filter(c -> c.getPurpose() != null && c.getPurpose().getId().equals(p.getId()) && c.getStatus() == ConsentArtifact.ConsentStatus.ACTIVE)
                    .count();

            // Calculate percentage based on total unique users
            double percentage = (totalUniqueUsers == 0) ? 0 : ((double) activeCount / totalUniqueUsers) * 100;

            purposeAccessStats.add(Map.of(
                    "name", p.getName(),
                    "percentage", (int) Math.round(percentage)
            ));
        }
        metrics.put("purposeAccessStats", purposeAccessStats);

        return ResponseEntity.ok(metrics);
    }

    // =====================================================
    // Exception Handler
    // =====================================================
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurityException(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
    }
}