package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "purposes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Purpose {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id")
    private String tenantId;

    private String name;

    private String description;

    // FIXED: Using 'Boolean' class instead of primitive 'boolean' prevents the JSON null error!
    // We default it to true so new purposes are active immediately.
    private Boolean isActive = true;

   @Column(name = "is_mandatory")
    private Boolean mandatory = false;

    @Column(name = "retention_period_months")
    private Integer retentionPeriodMonths = 6;
}