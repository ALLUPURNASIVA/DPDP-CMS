package com.DPDP.cms.repository;

import com.DPDP.cms.entity.GeneralUserOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface GeneralUserOtpRepository extends JpaRepository<GeneralUserOtp, UUID> {

    Optional<GeneralUserOtp> findTopByUserIdAndEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String userId,
            String email,
            LocalDateTime now
    );

    boolean existsByUserIdAndEmailAndVerifiedAtIsNotNull(String userId, String email);
}