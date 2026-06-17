package com.DPDP.cms.controller;


import com.DPDP.cms.entity.*;
import com.DPDP.cms.repository.*;
import com.DPDP.cms.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/consent")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentArtifactRepository consentRepo;
    private final PurposeRepository purposeRepo;
    private final AuditService auditService;
    private final EmailService emailService;
    private final UserRepository userRepo;

    private String getAuth0UserId() {

    var authentication =
            SecurityContextHolder.getContext().getAuthentication();

    System.out.println("AUTH = " + authentication);

    if (authentication != null &&
            authentication.getPrincipal() instanceof Jwt jwt) {

        return jwt.getClaimAsString("sub");
    }

    return "TEST_USER";
}

    private void ensureUserExists(String userId, String email) {
        if (!userRepo.existsById(userId)) {
            User newUser = User.builder()
                    .id(userId)
                    .email(email)
                    .role("GENERAL_USER")
                    // If your User entity doesn't have a builder, just use:
                    // User newUser = new User(); newUser.setId(userId); newUser.setEmail(email);
                    .build();
            userRepo.save(newUser);
        }
    }

    // Journey 1: View Available Purposes
    @GetMapping("/purposes/{tenantId}")
    public List<Purpose> getPurposes(@PathVariable String tenantId) {
        return purposeRepo.findByTenantId(tenantId);
    }

    // Journey 1: Submit Consent (Upgraded with Dynamic Emails)
    @PostMapping("/collect/{tenantId}")
    public ResponseEntity<?> collectConsent(
            @PathVariable String tenantId,
            @RequestBody List<Long> purposeIds,
            @RequestHeader(value = "X-User-Email") String userEmail,
            HttpServletRequest request) {

        String userId = getAuth0UserId();

        // Check and create the user in the database
        ensureUserExists(userId, userEmail);

        // 1. Create a list to store the names of the purposes we are granting
        List<String> grantedPurposeNames = new ArrayList<>();

        purposeIds.forEach(pId -> {
            Purpose purpose = purposeRepo.findById(pId).orElseThrow();

            // 2. Add the readable name to our list
            grantedPurposeNames.add(purpose.getName());

            ConsentArtifact artifact = ConsentArtifact.builder()
                    .userId(userId)
                    .tenantId(tenantId)
                    .purpose(purpose)
                    .status(ConsentArtifact.ConsentStatus.ACTIVE)
                    .grantedAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusYears(1))
                    .build();
            consentRepo.save(artifact);
        });

        // 3. Create a beautiful, dynamic email message with bullet points
        String dynamicEmailBody = "You have successfully granted consent to " + tenantId + " for the following data purposes:\n\n"
                + "- " + String.join("\n- ", grantedPurposeNames)
                + "\n\nYou can review or withdraw these at any time by logging into your DPDP Portal.";

        auditService.logAction(userId, tenantId, AuditLog.ActionType.GRANT, request.getRemoteAddr(), purposeIds.toString());

        // 4. Send the dynamic email!
        emailService.sendNotification(userEmail, "Consent Granted: " + tenantId, dynamicEmailBody);

        return ResponseEntity.ok(Map.of("message", "Consents recorded successfully"));
    }

    // Journey 1: View Active Consents
    @GetMapping("/history")
public ResponseEntity<?> getHistory() {
    try {
        return ResponseEntity.ok(
                consentRepo.findByUserId(getAuth0UserId())
        );
    } catch (Exception e) {
        e.printStackTrace();

        return ResponseEntity.internalServerError().body(
                Map.of(
                        "error", e.getClass().getName(),
                        "message", e.getMessage()
                )
        );
    }
}
    // Journey 1: Withdraw Consent
    // Journey 1: Withdraw Consent (Upgraded with Detailed Emails)
    @PostMapping("/withdraw/{artifactId}")
    public ResponseEntity<?> withdrawConsent(
            @PathVariable UUID artifactId,
            @RequestHeader(value = "X-User-Email") String userEmail,
            HttpServletRequest request) {

        String userId = getAuth0UserId();
        ConsentArtifact artifact = consentRepo.findById(artifactId).orElseThrow();

        if (!artifact.getUserId().equals(userId)) {
            return ResponseEntity.status(403).build(); // Security check
        }

        artifact.setStatus(ConsentArtifact.ConsentStatus.WITHDRAWN);
        consentRepo.save(artifact);

        // 1. Extract the specific details for the email
        String tenantName = artifact.getTenantId();
        String purposeName = artifact.getPurpose().getName();

        // 2. Create a detailed, professional email message for withdrawal
        String dynamicEmailBody = "You have successfully withdrawn your consent from " + tenantName + " for the following data purpose:\n\n"
                + "- " + purposeName
                + "\n\n" + tenantName + " has been legally notified to cease processing your data for this specific purpose. You can review your remaining active consents or re-grant this permission at any time by logging into your DPDP Portal.";

        auditService.logAction(userId, tenantName, AuditLog.ActionType.WITHDRAW, request.getRemoteAddr(), artifactId.toString());

        // 3. Send the detailed email!
        emailService.sendNotification(userEmail, "Consent Withdrawn: " + tenantName, dynamicEmailBody);

        return ResponseEntity.ok(Map.of("message", "Consent successfully withdrawn"));
    }

    // Journey 2: Validate Consent (For Fiduciary External Systems)
    // Journey 2: Validate Consent (Bulletproof JSON parsing)
    @PostMapping("/validate")
    public ResponseEntity<?> validateConsent(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            // Safely convert whatever JSON data type arrives into Strings and Longs
            String userId = payload.get("userId").toString();
            String tenantId = payload.get("tenantId").toString();
            Long purposeId = Long.parseLong(payload.get("purposeId").toString());

            boolean isValid = consentRepo.existsByUserIdAndPurposeIdAndTenantIdAndStatus(
                    userId, purposeId, tenantId, ConsentArtifact.ConsentStatus.ACTIVE);

            auditService.logAction(userId, tenantId, AuditLog.ActionType.VALIDATE, request.getRemoteAddr(), purposeId.toString());

            return ResponseEntity.ok(Map.of("valid", isValid));

        } catch (Exception e) {
            System.err.println("Validation Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid payload format"));
        }
    }
}
