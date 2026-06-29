package com.DPDP.cms.controller;

import com.DPDP.cms.dto.ComplianceLogDTO;
import com.DPDP.cms.entity.ComplianceLog;
import com.DPDP.cms.entity.Complaint;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.ComplianceLogRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/compliance-logs")
@RequiredArgsConstructor
public class ComplianceLogController {

    private final ComplianceLogRepository complianceLogRepository;
    private final UserRepository userRepository;

    @GetMapping
    public List<ComplianceLogDTO> getComplianceLogs(Principal principal) {
        String authId = principal.getName(); // e.g., "auth0|6a3cde43..."

        // 1. Find the admin using the built-in findById (since the Auth0 ID IS the ID field)
        User admin = userRepository.findById(authId)
                .orElseThrow(() -> new RuntimeException("Admin not found with ID: " + authId));

        // 2. Fetch logs
        List<ComplianceLog> logs = complianceLogRepository.findByTenantIdOrderByTimestampDesc(admin.getTenantId());

        // 3. Map safely
        return logs.stream().map(log -> {
            // Use findById to resolve emails since the ID field IS the Auth0 string
            String adminEmail = (log.getAdminEmail() != null)
                    ? userRepository.findById(log.getAdminEmail()).map(User::getEmail).orElse(log.getAdminEmail())
                    : "Unknown";

            String targetEmail = (log.getTargetIdentity() != null)
                    ? userRepository.findById(log.getTargetIdentity()).map(User::getEmail).orElse(log.getTargetIdentity())
                    : "Unknown";

            return ComplianceLogDTO.builder()
                    .id(log.getId())
                    .action(log.getAction())
                    .adminEmail(adminEmail)
                    .targetEmail(targetEmail)
                    .timestamp(log.getTimestamp())
                    .reason(log.getReason())
                    .actorId(log.getActorId())
                    .actorRole(log.getActorRole())
                    .actionType(log.getActionType())
                    .build();
        }).toList();
    }
}