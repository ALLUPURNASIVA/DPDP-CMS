package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "fiduciary_workers")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FiduciaryWorker {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "added_at")
    private LocalDateTime addedAt;
}