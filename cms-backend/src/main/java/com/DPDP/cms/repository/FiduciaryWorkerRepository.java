package com.DPDP.cms.repository;

import com.DPDP.cms.entity.FiduciaryWorker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FiduciaryWorkerRepository extends JpaRepository<FiduciaryWorker, UUID> {
    List<FiduciaryWorker> findByTenantId(String tenantId);
    boolean existsByEmailAndTenantId(String email, String tenantId);
    Optional<FiduciaryWorker> findByEmail(String email);

    long countByTenantId(String tenantId);
}