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

@RestController
@RequestMapping("/api/consent")
@RequiredArgsConstructor
public class ConsentController {

    private final ConsentArtifactRepository consentRepo;
    private final PurposeRepository purposeRepo;
    private final AuditService auditService;
    private final EmailService emailService;

    private String getAuth0UserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaimAsString("sub");
        }
        throw new IllegalStateException("Missing or invalid JWT Authentication principal");
    }

    private String getUserEmail() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String email = jwt.getClaimAsString("email");
            return email != null ? email : "user@example.com";
        }
        return "user@example.com";
    }

    // Journey 1: View Available Purposes
    @GetMapping("/purposes/{tenantId}")
    public List<Purpose> getPurposes(@PathVariable String tenantId) {
        return purposeRepo.findByTenantId(tenantId);
    }

    // Journey 1: Submit Consent
    @PostMapping("/collect/{tenantId}")
    public ResponseEntity<?> collectConsent(@PathVariable String tenantId, @RequestBody List<Long> purposeIds, HttpServletRequest request) {
        String userId = getAuth0UserId();

        purposeIds.forEach(pId -> {
            Purpose purpose = purposeRepo.findById(pId).orElseThrow();
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

        auditService.logAction(userId, tenantId, AuditLog.ActionType.GRANT, request.getRemoteAddr(), purposeIds.toString());
        emailService.sendNotification(getUserEmail(), "Consent Granted", "You have granted new data consents.");

        return ResponseEntity.ok(Map.of("message", "Consents recorded successfully"));
    }

    // Journey 1: View Active Consents
    @GetMapping("/history")
    public List<ConsentArtifact> getHistory() {
        return consentRepo.findByUserId(getAuth0UserId());
    }

    // Journey 1: Withdraw Consent
    @PostMapping("/withdraw/{artifactId}")
    public ResponseEntity<?> withdrawConsent(@PathVariable UUID artifactId, HttpServletRequest request) {
        String userId = getAuth0UserId();
        ConsentArtifact artifact = consentRepo.findById(artifactId).orElseThrow();

        if (!artifact.getUserId().equals(userId)) {
            return ResponseEntity.status(403).build(); // Security check
        }

        artifact.setStatus(ConsentArtifact.ConsentStatus.WITHDRAWN);
        consentRepo.save(artifact);

        auditService.logAction(userId, artifact.getTenantId(), AuditLog.ActionType.WITHDRAW, request.getRemoteAddr(), artifactId.toString());
        emailService.sendNotification(getUserEmail(), "Consent Withdrawn", "You withdrew consent for: " + artifact.getPurpose().getName());

        return ResponseEntity.ok(Map.of("message", "Consent successfully withdrawn"));
    }

    // Journey 2: Validate Consent (For Fiduciary External Systems)
    @PostMapping("/validate")
    public ResponseEntity<?> validateConsent(@RequestBody Map<String, String> payload, HttpServletRequest request) {
        String userId = payload.get("userId");
        Long purposeId = Long.parseLong(payload.get("purposeId"));
        String tenantId = payload.get("tenantId");

        boolean isValid = consentRepo.existsByUserIdAndPurposeIdAndTenantIdAndStatus(
                userId, purposeId, tenantId, ConsentArtifact.ConsentStatus.ACTIVE);

        auditService.logAction(userId, tenantId, AuditLog.ActionType.VALIDATE, request.getRemoteAddr(), purposeId.toString());
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
}
