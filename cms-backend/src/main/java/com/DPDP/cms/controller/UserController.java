package com.DPDP.cms.controller;

import com.DPDP.cms.service.DataErasureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.DPDP.cms.dto.UserCompanyStatsResponse;
import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.repository.ComplaintRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final DataErasureService dataErasureService;
    private final ComplaintRepository complaintRepository;
    private final ConsentArtifactRepository consentArtifactRepository;

    @DeleteMapping("/forget-me")
    public ResponseEntity<Void> rightToBeForgotten(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail
    ) {
        dataErasureService.executeRightToBeForgotten(userId, userEmail);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/company-stats/{tenantId}")
public ResponseEntity<UserCompanyStatsResponse> getCompanyStats(
        @PathVariable String tenantId
) {

    long activeConsents =
            consentArtifactRepository.countByTenantIdAndStatus(
                    tenantId,
                    ConsentArtifact.ConsentStatus.ACTIVE
            );

    long complaintsRaised =
            complaintRepository.countByTenantId(
                    tenantId
            );

    long openComplaints =
            complaintRepository.countByTenantIdAndStatus(
                    tenantId,
                    "OPEN"
            );

    return ResponseEntity.ok(
            new UserCompanyStatsResponse(
                    activeConsents,
                    complaintsRaised,
                    openComplaints
            )
    );
}
}