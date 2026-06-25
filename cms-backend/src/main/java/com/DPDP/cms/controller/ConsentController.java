package com.DPDP.cms.controller;

import com.DPDP.cms.dto.FiduciaryDto;
import com.DPDP.cms.entity.*;
import com.DPDP.cms.repository.*;
import com.DPDP.cms.service.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.DPDP.cms.repository.TenantRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;
import com.DPDP.cms.dto.ActiveConsentDto;

@RestController
@RequestMapping("/api/consent")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentArtifactRepository consentRepo;
    private final PurposeRepository purposeRepo;
    private final AuditService auditService;
    private final EmailService emailService;
    private final UserRepository userRepo;
    private final NotificationLogRepository notificationRepo;
    private final TenantRepository tenantRepo;

    private String getAuth0UserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("sub");
        }
        throw new IllegalStateException("Missing or invalid JWT Authentication principal");
    }

    private void ensureUserExists(String userId, String email) {
        if (!userRepo.existsById(userId)) {
            User newUser = User.builder()
                    .id(userId)
                    .email(email)
                    .role("GENERAL_USER")
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

            LocalDateTime expiry = LocalDateTime.now().plusMonths(purpose.getRetentionPeriodMonths());

            ConsentArtifact artifact = ConsentArtifact.builder()
                    .userId(userId)
                    .tenantId(tenantId)
                    .purpose(purpose)
                    .status(ConsentArtifact.ConsentStatus.ACTIVE)
                    .grantedAt(LocalDateTime.now())
                    .expiresAt(expiry)
                    .build();
            consentRepo.save(artifact);

            // UPDATED: Move the audit log INSIDE the loop and pass the new arguments
            // This ensures every granted purpose shows up as its own row in the Admin Dashboard
            auditService.logAction(
                    userId,
                    tenantId,
                    AuditLog.ActionType.GRANT,
                    request.getRemoteAddr(),
                    "Granted purpose: " + purpose.getName(),
                    purpose.getId(),
                    "ACTIVE",
                    expiry
            );
        });

        // 3. Create a beautiful, dynamic email message with bullet points
        String dynamicEmailBody = "You have successfully granted consent to " + tenantId + " for the following data purposes:\n\n"
                + "- " + String.join("\n- ", grantedPurposeNames)
                + "\n\nYou can review or withdraw these at any time by logging into your DPDP Portal.";

        // 4. Send the dynamic email!
        emailService.sendNotification(userEmail, "Consent Granted: " + tenantId, dynamicEmailBody);

        // --- NEW: FIRE THE NOTIFICATION TELEMETRY ---
        if (userEmail != null && !userEmail.isEmpty()) {
            NotificationLog notif = NotificationLog.builder()
                    .messageId("msg_" + java.util.UUID.randomUUID().toString().substring(0, 8))
                    .recipient(userEmail)
                    .status(NotificationLog.NotificationStatus.SENT)
                    .timestamp(java.time.LocalDateTime.now())
                    .build();
            notificationRepo.save(notif);
        }

        return ResponseEntity.ok(Map.of("message", "Consents recorded successfully"));
    }

    // Journey 1: View Active Consents
    @GetMapping("/history")
    public List<ConsentArtifact> getHistory() {
        return consentRepo.findByUserId(getAuth0UserId());
    }

    @GetMapping("/active-consents")
    public List<ActiveConsentDto> getActiveConsents() {
        return consentRepo.findByUserId(getAuth0UserId())
                .stream()
                .filter(consent -> consent.getStatus().name().equals("ACTIVE"))
                .map(consent -> new ActiveConsentDto(
                        consent.getTenantId(),
                        consent.getPurpose().getName(),
                        consent.getGrantedAt(),
                        consent.getExpiresAt(),
                        consent.getStatus().name()
                ))
                .toList();
    }

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

        // UPDATED: Pass the new parameters to the Audit Service
        auditService.logAction(
                userId,
                tenantName,
                AuditLog.ActionType.WITHDRAW,
                request.getRemoteAddr(),
                artifactId.toString(),
                artifact.getPurpose().getId(),
                "WITHDRAWN",
                artifact.getExpiresAt()
        );

        // 3. Send the detailed email!
        emailService.sendNotification(userEmail, "Consent Withdrawn: " + tenantName, dynamicEmailBody);

        // --- NEW: FIRE THE NOTIFICATION TELEMETRY ---
        if (userEmail != null && !userEmail.isEmpty()) {
            NotificationLog notif = NotificationLog.builder()
                    .messageId("msg_" + java.util.UUID.randomUUID().toString().substring(0, 8))
                    .recipient(userEmail)
                    .status(NotificationLog.NotificationStatus.SENT)
                    .timestamp(java.time.LocalDateTime.now())
                    // Optional: Add a note to the errorLog/diagnostics column to show it was a withdrawal receipt!
                    .errorLog("System Event: Withdrawal Receipt Delivered")
                    .build();
            notificationRepo.save(notif);
        }

        return ResponseEntity.ok(Map.of("message", "Consent successfully withdrawn"));
    }

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

            // UPDATED: Pass the new parameters to the Audit Service
            auditService.logAction(
                    userId,
                    tenantId,
                    AuditLog.ActionType.VALIDATE,
                    request.getRemoteAddr(),
                    "Validation check",
                    purposeId,
                    isValid ? "ACTIVE" : "INVALID",
                    null // Expiry date isn't immediately available without a deeper query during validation
            );

            return ResponseEntity.ok(Map.of("valid", isValid));

        } catch (Exception e) {
            System.err.println("Validation Error: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid payload format"));
        }
    }

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
                            t.getId(),
                            t.getId(),
                            t.getName(),
                            purposeCount
                    );

                })
                .toList();
    }
}