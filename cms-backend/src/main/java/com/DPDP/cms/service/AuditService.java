package com.DPDP.cms.service;

import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    // Updated signature to accept the new tracking fields
    public void logAction(String userId, String tenantId, AuditLog.ActionType action, String sourceIp, String payload, Long purposeId, String consentStatus, LocalDateTime expiryDate) {

        String rawData = userId + tenantId + action.name() + payload + LocalDateTime.now();
        String hash = generateSha256Hash(rawData);

        AuditLog log = AuditLog.builder()
                .userId(userId)
                .tenantId(tenantId)
                .actionType(action)
                .timestamp(LocalDateTime.now())
                .sourceIp(sourceIp)
                .cryptographicHash(hash)
                .purposeId(purposeId)           // New
                .consentStatus(consentStatus)   // New
                .expiryDate(expiryDate)         // New
                .build();

        auditLogRepository.save(log);
    }

    private String generateSha256Hash(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}