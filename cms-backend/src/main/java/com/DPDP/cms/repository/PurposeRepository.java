package com.DPDP.cms.repository;

import com.DPDP.cms.entity.Purpose;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;

public interface PurposeRepository extends JpaRepository<Purpose, Long> {
    List<Purpose> findByTenantId(String tenantId);
    @Transactional
    void deleteByTenantId(String tenantId);

}