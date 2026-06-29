package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String tenantId;

    private String userId;

    private String subject;

    @Column(length = 2000)
    private String description;

    private String status;

    private LocalDateTime createdAt;

    private String resolutionNote;
}
