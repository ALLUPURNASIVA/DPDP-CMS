package com.DPDP.cms.repository;

import com.DPDP.cms.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, String> {

    List<Complaint> findByTenantId(String tenantId);

    List<Complaint> findByUserId(String userId);

    long countByTenantId(String tenantId);

    long countByTenantIdAndStatus(
            String tenantId,
            String status
    );

    long countByUserIdAndTenantId(
            String userId,
            String tenantId
    );

    long countByUserIdAndTenantIdAndStatus(
            String userId,
            String tenantId,
            String status
    );

    List<Complaint> findByTenantIdAndStatus(String tenantId, String status);
}