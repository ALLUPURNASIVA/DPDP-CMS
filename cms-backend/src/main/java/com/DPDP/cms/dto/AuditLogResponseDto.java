package com.DPDP.cms.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class AuditLogResponseDto {
    private String id;
    private String userId;
    private String userEmail;     // Fetched from User table
    private String tenantId;
    private String actionType;
    private LocalDateTime timestamp;
    private String sourceIp;
    private String cryptographicHash;

    // Only sending the name to the frontend
    private String purposeName;

    private String consentStatus;
    private LocalDateTime expiryDate;
}