package com.DPDP.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ActiveConsentDto {

    private String tenantId;
    private String purposeName;
    private LocalDateTime grantedAt;
    private LocalDateTime expiresAt;
    private String status;
}