package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {

    @Id
    private String id;

    private String name;
    // --- NEW FIELD FOR SOFT DELETION ---
    private Boolean isActive = true;
}