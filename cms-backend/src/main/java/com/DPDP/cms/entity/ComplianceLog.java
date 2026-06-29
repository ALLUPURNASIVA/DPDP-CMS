package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ComplianceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String tenantId;       // Which company
    private String adminEmail;     // Who did the action
    private String action;         // "PURGE_USER_DATA", "CONSENT_REVOKED"
    private String targetIdentity; // User's Email or ID
    private String reason;         // e.g., "Right to be Forgotten"
    private LocalDateTime timestamp;
    private String actorId;     // The ID of the person (Admin or Worker)
    private String actorRole;   // "ADMIN" or "WORKER"
    private String actionType;  // e.g., "PURGE", "RESOLVE", "ESCALATE"
}