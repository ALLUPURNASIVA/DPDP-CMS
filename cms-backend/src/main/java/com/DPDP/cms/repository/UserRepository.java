package com.DPDP.cms.repository;

import com.DPDP.cms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {

    // Needed for role assignment — admin/fiduciary searches by email
    Optional<User> findByEmail(String email);
}