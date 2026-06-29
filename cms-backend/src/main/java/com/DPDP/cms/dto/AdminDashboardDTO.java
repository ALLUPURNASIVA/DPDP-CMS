package com.DPDP.cms.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AdminDashboardDTO {
    // KPIs
    private long totalUsers;
    private long totalWorkers;
    private long activeConsents;
    private long withdrawnConsents;

    // Percentages & Rates
    private double consentRetentionRate; // % of consents maintained over 30 days

    // Data for Charts
    private List<Map<String, Object>> purposeDistribution; // For Pie Chart
    private List<Map<String, Object>> activityComparison;  // For Bar Chart (Audit vs Compliance)
}
