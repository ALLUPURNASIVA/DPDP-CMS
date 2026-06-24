package com.DPDP.cms.repository;

import com.DPDP.cms.entity.ConsentArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ConsentArtifactRepository extends JpaRepository<ConsentArtifact, UUID> {

    List<ConsentArtifact> findByUserId(String userId);

    List<ConsentArtifact> findByPurposeIdAndStatus(
            Long purposeId,
            ConsentArtifact.ConsentStatus status
    );

    boolean existsByUserIdAndPurposeIdAndTenantIdAndStatus(
            String userId,
            Long purposeId,
            String tenantId,
            ConsentArtifact.ConsentStatus status
    );

    void deleteByUserId(String userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ConsentArtifact c SET c.status = 'EXPIRED' WHERE c.status = 'ACTIVE' AND c.expiresAt <= :now")
    int expireOldConsents(
            @Param("now") java.time.LocalDateTime now
    );

    @Query("SELECT c FROM ConsentArtifact c WHERE c.status = 'ACTIVE' AND c.expiresAt > :start AND c.expiresAt <= :end")
    List<ConsentArtifact> findConsentsExpiringInWindow(
            @Param("start") java.time.LocalDateTime start,
            @Param("end") java.time.LocalDateTime end
    );

    List<ConsentArtifact> findByTenantIdAndStatus(
            String tenantId,
            ConsentArtifact.ConsentStatus status
    );

    long countByTenantIdAndStatus(
            String tenantId,
            ConsentArtifact.ConsentStatus status
    );

    void deleteByTenantId(String tenantId);

    List<ConsentArtifact> findByTenantId(String tenantId);

    // Fetch all consent records for a specific user within your company
    List<ConsentArtifact> findByUserIdAndTenantId(String userId, String tenantId);

    Optional<ConsentArtifact> findByUserIdAndTenantIdAndPurposeId(String userId, String tenantId, Long purposeId);
}