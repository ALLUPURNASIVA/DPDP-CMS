package com.DPDP.cms.repository;

import com.DPDP.cms.entity.ComplianceLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ComplianceLogRepository extends JpaRepository<ComplianceLog, String> {
    List<ComplianceLog> findByTenantIdOrderByTimestampDesc(String tenantId);
}