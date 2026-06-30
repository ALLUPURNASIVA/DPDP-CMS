package com.DPDP.cms.repository;

import com.DPDP.cms.entity.PendingRoleAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PendingRoleAssignmentRepository extends JpaRepository<PendingRoleAssignment, Long> {

    Optional<PendingRoleAssignment> findByEmail(String email);

    Optional<PendingRoleAssignment> findByEmailIgnoreCase(String email);

    void deleteByEmail(String email);

    void deleteByEmailIgnoreCase(String email);

    void deleteByTenantId(String tenantId);
}
