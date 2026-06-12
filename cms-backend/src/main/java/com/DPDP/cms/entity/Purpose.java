package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "purposes")
@Data @NoArgsConstructor @AllArgsConstructor
public class Purpose {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private String tenantId;

    private String name;
    private String description;

    @Column(name = "is_mandatory")
    private boolean isMandatory;
}