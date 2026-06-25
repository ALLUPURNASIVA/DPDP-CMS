package com.DPDP.cms.controller;

import com.DPDP.cms.dto.AuditLogResponseDto;
import com.DPDP.cms.entity.AuditLog;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.repository.AuditLogRepository;
import com.DPDP.cms.repository.UserRepository;
import com.DPDP.cms.repository.PurposeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepo;
    private final UserRepository userRepo;
    private final PurposeRepository purposeRepo;

    @GetMapping("/admin/logs")
    public ResponseEntity<List<AuditLogResponseDto>> getAllLogs() {
        List<AuditLog> rawLogs = auditLogRepo.findAll();

        List<AuditLogResponseDto> enrichedLogs = rawLogs.stream().map(log -> {

            // 1. Resolve User Email safely
            String email = userRepo.findById(log.getUserId())
                    .map(User::getEmail)
                    .orElse("Unknown User");

            // 2. Resolve Purpose Name safely
            String purposeName = null;
            if (log.getPurposeId() != null) {
                purposeName = purposeRepo.findById(log.getPurposeId())
                        .map(Purpose::getName)
                        .orElse("Unknown Purpose");
            }

            // 3. Build the flattened response without the purposeId
            return AuditLogResponseDto.builder()
                    .id(log.getId().toString())
                    .userId(log.getUserId())
                    .userEmail(email)
                    .tenantId(log.getTenantId())
                    .actionType(log.getActionType().name())
                    .timestamp(log.getTimestamp())
                    .sourceIp(log.getSourceIp())
                    .cryptographicHash(log.getCryptographicHash())
                    .purposeName(purposeName) // Only the name is attached
                    .consentStatus(log.getConsentStatus())
                    .expiryDate(log.getExpiryDate())
                    .build();

        }).collect(Collectors.toList());

        return ResponseEntity.ok(enrichedLogs);
    }
}