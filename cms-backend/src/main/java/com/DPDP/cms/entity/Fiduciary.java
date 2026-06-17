package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.Setter;

@Entity
@Table(name = "fiduciaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Fiduciary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tenantId;

    private String name;
}
