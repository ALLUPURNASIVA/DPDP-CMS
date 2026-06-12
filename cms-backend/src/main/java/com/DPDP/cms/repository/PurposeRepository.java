package com.DPDP.cms.repository;

import com.DPDP.cms.entity.Purpose;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PurposeRepository extends JpaRepository<Purpose, Long> {
    List<Purpose> findByTenantId(String tenantId);
}
