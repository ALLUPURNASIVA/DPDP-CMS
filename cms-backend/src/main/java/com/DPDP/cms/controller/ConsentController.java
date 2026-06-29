package com.DPDP.cms.controller;

import com.DPDP.cms.dto.ActiveConsentDto;
import com.DPDP.cms.dto.FiduciaryDto;
import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.TenantRepository;
import com.DPDP.cms.repository.UserRepository;
import com.DPDP.cms.service.AuditService;
import com.DPDP.cms.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @GetMapping("/purposes/{tenantId}")
    public List<Purpose> getPurposes(@PathVariable String tenantId) {
        return purposeRepo.findByTenantId(tenantId);
    }

    @PostMapping("/collect/{tenantId}")
    public ResponseEntity<?> collectConsent(
            @PathVariable String tenantId,
            @RequestBody List<Long> purposeIds,
            @RequestHeader(value = "X-User-Email") String userEmail,
            HttpServletRequest request) {

        String userId = getAuth0UserId();
        ensureUserExists(userId, userEmail);

        List<String> grantedPurposeNames = new ArrayList<>();

        purposeIds.forEach(pId -> {
            Purpose purpose = purposeRepo.findById(pId).orElseThrow();
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

        String dynamicEmailBody = "You have successfully granted consent to " + tenantId + " for the following data purposes:\n\n"
                + "- " + String.join("\n- ", grantedPurposeNames)
                + "\n\nYou can review or withdraw these at any time by logging into your DPDP Portal.";

        EmailService.EmailDeliveryResult emailResult =
                emailService.sendNotification(userEmail, "Consent Granted: " + tenantId, dynamicEmailBody);

        if (userEmail != null && !userEmail.isBlank()) {
            NotificationLog notif = NotificationLog.builder()
                    .messageId(emailResult.messageId())
                    .recipient(userEmail)
                    .status(emailResult.status())
                    .timestamp(LocalDateTime.now())
                    .errorLog(emailResult.errorLog())
                    .build();
            notificationRepo.save(notif);
        }

        return ResponseEntity.ok(Map.of("message", "Consents recorded successfully"));
    }

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

    @PostMapping("/withdraw/{artifactId}")
    public ResponseEntity<?> withdrawConsent(
            @PathVariable UUID artifactId,
            @RequestHeader(value = "X-User-Email") String userEmail,
            HttpServletRequest request) {

        String userId = getAuth0UserId();
        ConsentArtifact artifact = consentRepo.findById(artifactId).orElseThrow();

        if (!artifact.getUserId().equals(userId)) {
            return ResponseEntity.status(403).build();
        }

        artifact.setStatus(ConsentArtifact.ConsentStatus.WITHDRAWN);
        consentRepo.save(artifact);

        String tenantName = artifact.getTenantId();
        String purposeName = artifact.getPurpose().getName();

        String dynamicEmailBody = "You have successfully withdrawn your consent from " + tenantName + " for the following data purpose:\n\n"
                + "- " + purposeName
                + "\n\n" + tenantName + " has been legally notified to cease processing your data for this specific purpose. You can review your remaining active consents or re-grant this permission at any time by logging into your DPDP Portal.";

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

        EmailService.EmailDeliveryResult emailResult =
                emailService.sendNotification(userEmail, "Consent Withdrawn: " + tenantName, dynamicEmailBody);

        if (userEmail != null && !userEmail.isBlank()) {
            NotificationLog notif = NotificationLog.builder()
                    .messageId(emailResult.messageId())
                    .recipient(userEmail)
                    .status(emailResult.status())
                    .timestamp(LocalDateTime.now())
                    .errorLog(emailResult.errorLog())
                    .build();
            notificationRepo.save(notif);
        }

        return ResponseEntity.ok(Map.of("message", "Consent successfully withdrawn"));
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateConsent(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            String userId = payload.get("userId").toString();
            String tenantId = payload.get("tenantId").toString();
            Long purposeId = Long.parseLong(payload.get("purposeId").toString());

            boolean isValid = consentRepo.existsByUserIdAndPurposeIdAndTenantIdAndStatus(
                    userId, purposeId, tenantId, ConsentArtifact.ConsentStatus.ACTIVE);

            auditService.logAction(
                    userId,
                    tenantId,
                    AuditLog.ActionType.VALIDATE,
                    request.getRemoteAddr(),
                    "Validation check",
                    purposeId,
                    isValid ? "ACTIVE" : "INVALID",
                    null
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
}
