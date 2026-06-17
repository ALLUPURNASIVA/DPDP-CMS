package com.DPDP.cms.repository;

import com.DPDP.cms.entity.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TenantRepository
        extends JpaRepository<Tenant, String> {
}
