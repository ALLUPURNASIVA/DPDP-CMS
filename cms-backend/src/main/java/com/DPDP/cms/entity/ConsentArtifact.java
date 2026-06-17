package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "consent_artifacts")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsentArtifact {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "tenant_id")
    private String tenantId;

    @ManyToOne
    @JoinColumn(name = "purpose_id")
    private Purpose purpose;

    @Enumerated(EnumType.STRING)
    private ConsentStatus status;

    @Column(name = "granted_at")
    private LocalDateTime grantedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public enum ConsentStatus { ACTIVE, WITHDRAWN, EXPIRED, REVOKED_BY_SYSTEM }
}
