package com.DPDP.cms.service;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DataErasureService {

    private final ConsentArtifactRepository consentRepo;
    private final AuditLogRepository auditRepo;
    private final NotificationLogRepository notifRepo;

    // Inject the new Auth0 Service
    private final Auth0ManagementService auth0Service;

    @Transactional
    public void executeRightToBeForgotten(String userId, String userEmail) {
        // 1. ERASURE: Wipe local DB consents
        consentRepo.deleteByUserId(userId);

        // 2. ERASURE: Wipe email telemetry
        if (userEmail != null && !userEmail.isEmpty()) {
            notifRepo.deleteByRecipient(userEmail);
        }

        // 3. ANONYMIZATION: Scrub Audit Logs
        List<AuditLog> userLogs = auditRepo.findByUserId(userId);
        for (AuditLog log : userLogs) {
            log.setUserId("ANONYMIZED_USER");
            log.setSourceIp("REDACTED");
        }
        auditRepo.saveAll(userLogs);

        // 4. THE KILL SWITCH: Destroy the root identity in Auth0
        // Placed at the end so if Auth0 fails, the DB erasure rolls back to prevent a fragmented state
        auth0Service.obliterateUser(userId);
    }
}