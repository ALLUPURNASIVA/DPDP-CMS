package com.DPDP.cms.service;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConsentExpiryEngine {

    private final ConsentArtifactRepository consentRepo;
    private final EmailService emailService;
    private final UserRepository userRepo;
    private final AuditLogRepository auditRepo;
    private final NotificationLogRepository notificationRepo;

    // --- WARNING BATCH: Runs at 8:00 AM every day ---
    @Scheduled(cron = "0 0 8 * * *")
    public void sendRenewalWarnings() {
        System.out.println("⏳ [8:00 AM] Scanning for consents expiring in 30 days...");

        // Look for anything expiring exactly 30 days from now
        LocalDateTime windowStart = LocalDateTime.now().plusDays(29);
        LocalDateTime windowEnd = LocalDateTime.now().plusDays(30);

        List<ConsentArtifact> expiringSoon = consentRepo.findConsentsExpiringInWindow(windowStart, windowEnd);

        for (ConsentArtifact artifact : expiringSoon) {
            userRepo.findById(artifact.getUserId()).ifPresent(user -> {
                String subject = "Action Required: " + artifact.getPurpose().getName() + " Consent Expiring for " + artifact.getTenantId();
                String body = "Your consent for '" + artifact.getPurpose().getName() + "' with " +
                        artifact.getTenantId() + " will legally expire in 30 days.\n\n" +
                        "If you wish to continue using their services without interruption, please log into your DPDP Portal to renew your consent.";

                emailService.sendNotification(user.getEmail(), subject, body);
            });
        }
        System.out.println("✅ Warning Batch completed. Sent " + expiringSoon.size() + " emails.");
    }

    // --- EXPIRY BATCH: Runs at 3:00 AM every day ---
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void processExpirations() {
        System.out.println("⏳ [3:00 AM] Starting Automated Consent Expiry Engine...");

        LocalDateTime now = LocalDateTime.now();

        // 1. Fetch the records that are ABOUT to expire
        List<ConsentArtifact> expiringToday = consentRepo.findConsentsExpiringInWindow(now.minusYears(10), now);

        for (ConsentArtifact artifact : expiringToday) {
            // 2. Write the System Audit Logs
            AuditLog log = AuditLog.builder()
                    .userId(artifact.getUserId())
                    .tenantId(artifact.getTenantId())
                    .actionType(AuditLog.ActionType.EXPIRED)
                    .timestamp(now)
                    .sourceIp("SYSTEM_CRON")
                    .cryptographicHash(UUID.randomUUID().toString())
                    .build();
            auditRepo.save(log);

            // 3. Send the Expiration Notice Email
            userRepo.findById(artifact.getUserId()).ifPresent(user -> {
                String subject = "Notice: " + artifact.getPurpose().getName() + " Consent Expired for " + artifact.getTenantId();
                String body = "Your consent for '" + artifact.getPurpose().getName() + "' with " +
                        artifact.getTenantId() + " has officially expired after 6 months.\n\n" +
                        "They have been legally notified to cease processing your data for this purpose.";
                emailService.sendNotification(user.getEmail(), subject, body);
            });
        }

        // 4. Execute the high-performance bulk update
        int expiredCount = consentRepo.expireOldConsents(now);

        System.out.println("✅ Expiry Engine completed. [" + expiredCount + "] records marked as EXPIRED and audited.");
    }
}