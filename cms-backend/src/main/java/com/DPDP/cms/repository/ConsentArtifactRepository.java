package com.DPDP.cms.repository;


import com.DPDP.cms.entity.ConsentArtifact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ConsentArtifactRepository extends JpaRepository<ConsentArtifact, UUID> {
    List<ConsentArtifact> findByUserId(String userId);
    boolean existsByUserIdAndPurposeIdAndTenantIdAndStatus(String userId, Long purposeId, String tenantId, ConsentArtifact.ConsentStatus status);
}
