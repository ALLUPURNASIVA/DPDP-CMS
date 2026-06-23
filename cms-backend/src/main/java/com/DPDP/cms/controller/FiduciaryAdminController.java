package com.DPDP.cms.controller;

import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.FiduciaryWorker;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.FiduciaryWorkerRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

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
        // If the user is a GENERAL_USER, this next line will throw the SecurityException
        // and return a 403 Forbidden before it ever reaches the return statement.
        String tenantId = getAuthenticatedTenantId();

        // If they survive the check, they are authorized!
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

        // SECURITY CHECK: Verify ownership before editing
        if (!existingPurpose.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access Denied: You do not own this purpose.");
        }

        // Apply the updates (Fixed Lombok naming conventions)
        existingPurpose.setName(updatedData.getName());
        existingPurpose.setDescription(updatedData.getDescription());
        existingPurpose.setRetentionPeriodMonths(updatedData.getRetentionPeriodMonths());

        // If your entity uses "mandatory" instead of "isMandatory", use this:
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

        // SECURITY CHECK: Verify ownership before retiring
        if (!existingPurpose.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access Denied: You do not own this purpose.");
        }

        // Soft delete
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

        // Map the database entities to a clean JSON structure for the frontend
        List<java.util.Map<String, Object>> response = consents.stream().map(c -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            // Pass the full UUID as a string[cite: 1]
            map.put("id", c.getId().toString());

            String email = userRepo.findById(c.getUserId())
                    .map(com.DPDP.cms.entity.User::getEmail)
                    .orElse(c.getUserId());

            map.put("userEmail", email);
            map.put("purposeName", c.getPurpose() != null ? c.getPurpose().getName() : "Unknown");
            map.put("status", c.getStatus().name());
            map.put("grantedAt", c.getGrantedAt());
            // Add the expiration date[cite: 1]
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

        // 1. Locate User
        java.util.Optional<com.DPDP.cms.entity.User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            response.put("found", false);
            return ResponseEntity.ok(response);
        }

        String userId = userOpt.get().getId();
        response.put("found", true);
        response.put("userId", userId);

        // 2. Fetch all Active Purposes for the Company
        List<com.DPDP.cms.entity.Purpose> activePurposes = purposeRepo.findByTenantId(tenantId).stream()
                .filter(p -> p.getIsActive() == null || p.getIsActive()) // Handle nulls safely
                .toList();

        // 3. Fetch all Consents for this User
        List<ConsentArtifact> userConsents = consentRepo.findByUserIdAndTenantId(userId, tenantId);

        // 4. Merge them into a single Matrix
        List<java.util.Map<String, Object>> matrix = new java.util.ArrayList<>();

        for (com.DPDP.cms.entity.Purpose purpose : activePurposes) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("purposeName", purpose.getName());
            map.put("description", purpose.getDescription());
            map.put("isMandatory", purpose.getMandatory());

            // Check if the user has an artifact for this specific purpose
            java.util.Optional<ConsentArtifact> artifact = userConsents.stream()
                    .filter(c -> c.getPurpose() != null && c.getPurpose().getId().equals(purpose.getId()))
                    .findFirst();

            if (artifact.isPresent()) {
                ConsentArtifact c = artifact.get();
                map.put("status", c.getStatus().name());
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
    public ResponseEntity<List<FiduciaryWorker>> getWorkers() {
        return ResponseEntity.ok(workerRepo.findByTenantId(getAuthenticatedTenantId()));
    }

    @PostMapping("/workers")
    public ResponseEntity<?> addWorker(@RequestBody java.util.Map<String, String> payload) {
        String email = payload.get("email");
        String tenantId = getAuthenticatedTenantId();

        if (workerRepo.existsByEmailAndTenantId(email, tenantId)) {
            return ResponseEntity.badRequest().body("Worker already authorized.");
        }

        FiduciaryWorker worker = FiduciaryWorker.builder()
                .tenantId(tenantId)
                .email(email)
                .addedAt(java.time.LocalDateTime.now())
                .build();

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

        // 1. Fetch data for the specific tenant
        List<ConsentArtifact> data = consentRepo.findByTenantId(tenantId);

        // 2. Build CSV string - Added 'ExpiresAt' to the header
        StringBuilder csv = new StringBuilder("ID,UserEmail,Status,Purpose,GrantedAt,ExpiresAt\n");

        for (ConsentArtifact c : data) {
            // Resolve email from ID
            String email = userRepo.findById(c.getUserId())
                    .map(User::getEmail)
                    .orElse(c.getUserId());

            csv.append(c.getId()).append(",")
                    .append(email).append(",")
                    .append(c.getStatus()).append(",")
                    .append(c.getPurpose() != null ? c.getPurpose().getName() : "None").append(",")
                    .append(c.getGrantedAt() != null ? c.getGrantedAt() : "N/A").append(",")
                    .append(c.getExpiresAt() != null ? c.getExpiresAt() : "N/A").append("\n");
        }

        byte[] content = csv.toString().getBytes();

        // 3. Return as a CSV file download
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audit_report.csv")
                .contentType(org.springframework.http.MediaType.parseMediaType("text/csv"))
                .body(content);
    }

    // =====================================================
    // EXECUTIVE ANALYTICS COMMAND CENTER
    // =====================================================
    @GetMapping("/analytics")
    public ResponseEntity<java.util.Map<String, Object>> getAnalytics() {
        // 1. Identify the logged-in admin's company
        String tenantId = getAuthenticatedTenantId();

        java.util.Map<String, Object> metrics = new java.util.HashMap<>();

        // 2. Fetch all raw data for this tenant
        List<ConsentArtifact> allConsents = consentRepo.findByTenantId(tenantId);
        // Fetch only ACTIVE purposes for the breakdown
        List<com.DPDP.cms.entity.Purpose> allPurposes = purposeRepo.findByTenantId(tenantId).stream()
                .filter(p -> p.getIsActive() == null || p.getIsActive())
                .toList();

        // 3. Calculate High-Level KPIs
        long totalConsents = allConsents.size();
        long activeConsents = allConsents.stream().filter(c -> c.getStatus() == ConsentArtifact.ConsentStatus.ACTIVE).count();
        long withdrawnConsents = allConsents.stream().filter(c -> c.getStatus() == ConsentArtifact.ConsentStatus.WITHDRAWN).count();

        // Calculate health (Avoid divide by zero)
        int complianceHealth = totalConsents == 0 ? 100 : (int) ((activeConsents * 100.0f) / totalConsents);

        metrics.put("totalConsents", totalConsents);
        metrics.put("activeConsents", activeConsents);
        metrics.put("withdrawnConsents", withdrawnConsents);
        metrics.put("complianceHealth", complianceHealth);

        // 4. Calculate "Consent by Purpose" Breakdown
        List<java.util.Map<String, Object>> purposeBreakdown = new java.util.ArrayList<>();

        for (com.DPDP.cms.entity.Purpose p : allPurposes) {
            long count = allConsents.stream()
                    .filter(c -> c.getPurpose() != null && c.getPurpose().getId().equals(p.getId()) && c.getStatus() == ConsentArtifact.ConsentStatus.ACTIVE)
                    .count();

            java.util.Map<String, Object> pStats = new java.util.HashMap<>();
            pStats.put("name", p.getName());
            pStats.put("activeCount", count);
            purposeBreakdown.add(pStats);
        }

        // Sort breakdown from highest to lowest so the UI looks clean
        purposeBreakdown.sort((a, b) -> Long.compare((Long) b.get("activeCount"), (Long) a.get("activeCount")));
        metrics.put("purposeBreakdown", purposeBreakdown);

        // Fetch count of workers for this tenant
        long workerCount = workerRepo.countByTenantId(tenantId);
        metrics.put("totalWorkers", workerCount);

        // Calculate unique users directly from the consent ledger
        long totalUsers = allConsents.stream()
                .map(ConsentArtifact::getUserId)
                .distinct()
                .count();
        metrics.put("totalUsers", totalUsers);

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