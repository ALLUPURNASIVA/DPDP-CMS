package com.DPDP.cms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CompanyStatsResponse {

    private long activeConsents;
    private long complaintsRaised;
    private long openComplaints;
}