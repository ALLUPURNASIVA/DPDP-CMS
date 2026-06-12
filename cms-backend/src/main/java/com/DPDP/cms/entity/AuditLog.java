package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "tenant_id")
    private String tenantId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type")
    private ActionType actionType;

    private LocalDateTime timestamp;

    @Column(name = "source_ip")
    private String sourceIp;

    @Column(name = "cryptographic_hash")
    private String cryptographicHash;

    public enum ActionType { GRANT, WITHDRAW, UPDATE, VALIDATE }
}