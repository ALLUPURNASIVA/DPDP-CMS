package com.DPDP.cms.controller;

import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.FiduciaryWorker;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.FiduciaryWorkerRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/worker")
public class WorkerController {

    @Autowired private FiduciaryWorkerRepository workerRepo;
    @Autowired private PurposeRepository purposeRepo;
    @Autowired private ConsentArtifactRepository consentRepo;
    @Autowired private UserRepository userRepo;

    // 1. SECURITY CORE: Identify the worker and their assigned company
    private String getWorkerTenantId(Jwt jwt, String headerEmail) {
        // Try token first (in case Auth0 is ever configured to send it)
        String email = jwt.getClaimAsString("email");

        // Fallback to the secure frontend header
        if (email == null || email.trim().isEmpty()) {
            email = headerEmail;
        }

        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Access Denied: Missing worker email identity.");
        }

        // Query the database
        java.util.Optional<FiduciaryWorker> workerOpt = workerRepo.findByEmail(email);

        if (workerOpt.isEmpty()) {
            throw new RuntimeException("Access Denied: " + email + " is not an authorized worker.");
        }

        return workerOpt.get().getTenantId();
    }

    // 2. Fetch Purposes
    @GetMapping("/purposes")
    public ResponseEntity<?> getPurposes(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Worker-Email", required = false) String workerEmail) {
        String tenantId = getWorkerTenantId(jwt, workerEmail);
        return ResponseEntity.ok(purposeRepo.findByTenantId(tenantId));
    }

    // 3. The Validation Engine
    @GetMapping("/validate")
    public ResponseEntity<java.util.Map<String, Object>> validateDataUsage(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Worker-Email", required = false) String workerEmail,
            @RequestParam String email, // This is the TARGET user's email
            @RequestParam Long purposeId) {

        String tenantId = getWorkerTenantId(jwt, workerEmail);
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("email", email);

        java.util.Optional<com.DPDP.cms.entity.User> userOpt = userRepo.findByEmail(email);
        if (userOpt.isEmpty()) {
            response.put("isCompliant", false);
            response.put("reason", "User not found in the system.");
            return ResponseEntity.ok(response);
        }

        String userId = userOpt.get().getId();
        // 3. Check Ledger for Valid Consent (Fetching the most recent record first)
        List<ConsentArtifact> history = consentRepo.findByUserIdAndTenantIdAndPurposeIdOrderByGrantedAtDesc(userId, tenantId, purposeId);

        if (history.isEmpty() || history.get(0).getStatus() != ConsentArtifact.ConsentStatus.ACTIVE) {
            response.put("isCompliant", false);
            response.put("reason", "No active consent found for this purpose.");
            return ResponseEntity.ok(response);
        }

        // Grab the most recent record
        ConsentArtifact consent = history.get(0);

        if (consent.getStatus() != ConsentArtifact.ConsentStatus.ACTIVE) {
            response.put("isCompliant", false);
            response.put("reason", "Consent is marked as " + consent.getStatus());
            return ResponseEntity.ok(response);
        }

        if (consent.getExpiresAt() != null && consent.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            response.put("isCompliant", false);
            response.put("reason", "Consent expired on " + consent.getExpiresAt().toLocalDate());
            return ResponseEntity.ok(response);
        }

        response.put("isCompliant", true);
        response.put("reason", "Valid, active consent verified.");
        response.put("receiptId", consent.getId().toString());
        response.put("expiresAt", consent.getExpiresAt());
        return ResponseEntity.ok(response);
    }

    // 4. FRONTEND ROUTE GUARD VERIFICATION
    @GetMapping("/verify")
    public ResponseEntity<?> verifyAccess(
            @AuthenticationPrincipal Jwt jwt,
            @RequestHeader(value = "X-Worker-Email", required = false) String workerEmail) {
        try {
            getWorkerTenantId(jwt, workerEmail);
            return ResponseEntity.ok(java.util.Map.of("authorized", true));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(java.util.Map.of("authorized", false, "reason", e.getMessage()));
        }
    }
}