package com.DPDP.cms.dto;

import lombok.Data;

@Data
public class ComplaintRequest {

    private String tenantId;
    private String userId;
    private String subject;
    private String description;
}