package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pending_role_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRoleAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String role;

    private String tenantId;

    @Column(nullable = false)
    private LocalDateTime assignedAt;
}