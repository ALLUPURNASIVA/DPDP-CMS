package com.DPDP.cms.dto;

import lombok.Data;

@Data
public class FiduciaryDto {

    private String id;
    private String tenantId;
    private String name;
    private Long purposeCount;

    public FiduciaryDto(
            String id,
            String tenantId,
            String name,
            Long purposeCount
    ) {
        this.id = id;
        this.tenantId = tenantId;
        this.name = name;
        this.purposeCount = purposeCount;
    }


}