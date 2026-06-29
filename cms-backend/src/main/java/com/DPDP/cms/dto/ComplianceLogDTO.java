package com.DPDP.cms.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ComplianceLogDTO {
    private String id;
    private String action;
    private String adminEmail;    // Resolved Email
    private String targetEmail;   // Resolved Email
    private LocalDateTime timestamp;
    private String reason;
    private String actorId;
    private String actorRole;
    private String actionType;
}