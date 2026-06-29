package com.DPDP.cms.repository;

import com.DPDP.cms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByEmail(String email);

    List<User> findByTenantIdAndRole(String tenantId, String role);

    long countByTenantIdAndRole(String tenantId, String role);

    Optional<User> findFirstByTenantIdAndRole(String tenantId, String role);
}