package com.DPDP.cms.controller;

import com.DPDP.cms.entity.ConsentArtifact;
import com.DPDP.cms.entity.Purpose;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.PurposeRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import com.DPDP.cms.dto.CompanyStatsResponse;
import com.DPDP.cms.repository.ComplaintRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiduciary")
@RequiredArgsConstructor
public class FiduciaryAdminController {

    private final UserRepository userRepo;
    private final PurposeRepository purposeRepo;
    private final ConsentArtifactRepository consentRepo;
    private final ComplaintRepository complaintRepo;
    /**
     * SECURITY GATEWAY: Extracts the Auth0 ID, finds the user in the DB,
     * and guarantees they are a Fiduciary Admin before returning their Tenant ID.
     */
    private String getAuthenticatedTenantId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String auth0Id = jwt.getClaimAsString("sub");

            // Look up the user in our database
            User user = userRepo.findById(auth0Id)
                    .orElseThrow(() -> new RuntimeException("User profile not found in system."));

            // Strictly enforce Role-Based Access Control (RBAC)
            if (!"FIDUCIARY_ADMIN".equals(user.getRole())) {
                throw new SecurityException("Access Denied: You do not have Fiduciary Admin privileges.");
            }

            if (user.getTenantId() == null) {
                throw new SecurityException("Access Denied: You are not assigned to a Company Tenant.");
            }

            return user.getTenantId(); // e.g., "TENANT_ACME"
        }
        throw new IllegalStateException("Missing or invalid JWT Authentication");
    }

    // =====================================================
    // Endpoint 1: Fetch Company Purposes (Filtered by Tenant)
    // =====================================================
    @GetMapping("/purposes")
    public ResponseEntity<List<Purpose>> getCompanyPurposes() {
        String tenantId = getAuthenticatedTenantId();

        // This query natively isolates the data!
        List<Purpose> tenantPurposes = purposeRepo.findByTenantId(tenantId);
        return ResponseEntity.ok(tenantPurposes);
    }

    // =====================================================
    // Endpoint 2: Fetch Active Consents (Filtered by Tenant)
    // =====================================================
    @GetMapping("/consents/active")
    public ResponseEntity<List<ConsentArtifact>> getCompanyActiveConsents() {
        String tenantId = getAuthenticatedTenantId();

        // Another isolated query!
        List<ConsentArtifact> activeConsents = consentRepo.findByTenantIdAndStatus(tenantId, ConsentArtifact.ConsentStatus.ACTIVE);
        return ResponseEntity.ok(activeConsents);
    }
    @GetMapping("/stats")
public ResponseEntity<CompanyStatsResponse> getCompanyStats() {

    String tenantId = getAuthenticatedTenantId();

    long activeConsents =
            consentRepo.countByTenantIdAndStatus(
                    tenantId,
                    ConsentArtifact.ConsentStatus.ACTIVE
            );

    long complaintsRaised =
            complaintRepo.countByTenantId(
                    tenantId
            );

    long openComplaints =
            complaintRepo.countByTenantIdAndStatus(
                    tenantId,
                    "OPEN"
            );

    return ResponseEntity.ok(
            new CompanyStatsResponse(
                    activeConsents,
                    complaintsRaised,
                    openComplaints
            )
    );
}

    // =====================================================
    // Exception Handler for Security Bounces
    // =====================================================
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, String>> handleSecurityException(SecurityException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
    }
}