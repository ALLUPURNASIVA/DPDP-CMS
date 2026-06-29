package com.DPDP.cms.repository;

import com.DPDP.cms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    // Needed for role assignment — admin/fiduciary searches by email
    Optional<User> findByEmail(String email);

    List<User> findByTenantIdAndRole(String authenticatedTenantId, String fiduciaryWorker);

    Object countByTenantIdAndRole(String tenantId, String fiduciaryWorker);
}