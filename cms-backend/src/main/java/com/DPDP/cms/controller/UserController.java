package com.DPDP.cms.controller;

import com.DPDP.cms.entity.PendingRoleAssignment;
import com.DPDP.cms.entity.Tenant;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.PendingRoleAssignmentRepository;
import com.DPDP.cms.repository.TenantRepository;
import com.DPDP.cms.repository.UserRepository;
import com.DPDP.cms.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;
    private final PendingRoleAssignmentRepository pendingRepo;
    private final TenantRepository tenantRepo;
    private final EmailService emailService;

    @Value("#{'${platform.admin.emails:}'.split(',')}")
    private List<String> platformAdminEmails;

    private boolean isPlatformAdminEmail(String email) {
        return email != null && platformAdminEmails.stream()
                .map(String::trim)
                .filter(adminEmail -> !adminEmail.isBlank())
                .anyMatch(adminEmail -> adminEmail.equalsIgnoreCase(email));
    }

    private String companyName(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            return "your assigned company";
        }

        return tenantRepo.findById(tenantId)
                .map(Tenant::getName)
                .filter(name -> name != null && !name.isBlank())
                .orElse(tenantId);
    }

    @Transactional
    @PostMapping("/sync")
    public ResponseEntity<?> syncUser(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getClaimAsString("sub");
        String email = jwt.getClaimAsString("email");

        if (email == null || email.isBlank()) {
            email = body.get("email");
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Authenticated profile does not contain an email."
            ));
        }

        boolean platformAdmin = isPlatformAdminEmail(email);
        Optional<PendingRoleAssignment> pendingAssignment = pendingRepo.findByEmailIgnoreCase(email);

        if (!userRepo.existsById(userId)) {
            User newUser = User.builder()
                    .id(userId)
                    .email(email)
                    .role(platformAdmin
                            ? "ADMIN"
                            : pendingAssignment.map(PendingRoleAssignment::getRole).orElse("GENERAL_USER"))
                    .tenantId(platformAdmin
                            ? null
                            : pendingAssignment.map(PendingRoleAssignment::getTenantId).orElse(null))
                    .build();

            userRepo.save(newUser);
        }

        User user = userRepo.findById(userId).orElseThrow();
        user.setEmail(email);

        if (platformAdmin) {
            user.setRole("ADMIN");
            user.setTenantId(null);
            userRepo.save(user);
        } else if (pendingAssignment.isPresent()) {
            PendingRoleAssignment pending = pendingAssignment.get();

            user.setRole(pending.getRole());
            user.setTenantId(pending.getTenantId());
            userRepo.save(user);

            pendingRepo.deleteByEmailIgnoreCase(email);
        } else {
            userRepo.save(user);
        }

        return ResponseEntity.ok(Map.of(
                "role", user.getRole(),
                "tenantId", user.getTenantId() != null ? user.getTenantId() : ""
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        User user = userRepo.findById(userId).orElseThrow();

        return ResponseEntity.ok(Map.of(
                "role", user.getRole(),
                "tenantId", user.getTenantId() != null ? user.getTenantId() : ""
        ));
    }

    @Transactional
    @PutMapping("/admin/assign-fiduciary")
    public ResponseEntity<?> assignFiduciaryAdmin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String tenantId = body.get("tenantId");
        String tenantName = body.get("tenantName");
        String displayName = tenantName != null ? tenantName : companyName(tenantId);

        Optional<User> existingUser = userRepo.findByEmailIgnoreCase(email);

        if (existingUser.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "User has not signed up yet. Ask them to create an account first."
            ));
        }

        User user = existingUser.get();
        user.setRole("FIDUCIARY_ADMIN");
        user.setTenantId(tenantId);
        userRepo.save(user);

        emailService.sendNotification(
                email,
                "You have been assigned as Fiduciary Admin - DPDP Portal",
                "Hello,\n\n" +
                        "You have been assigned as the Fiduciary Admin for " + displayName + " on the DPDP Compliance Portal.\n\n" +
                        "Please log in at: http://localhost:5173\n\n" +
                        "You will be automatically redirected to your Fiduciary Dashboard.\n\n" +
                        "This is a system-generated message."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Existing user promoted to Fiduciary Admin. Notification email sent."
        ));
    }

    @Transactional
    @PutMapping("/fiduciary/assign-worker")
    public ResponseEntity<?> assignWorker(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String requesterId = jwt.getClaimAsString("sub");
        User requester = userRepo.findById(requesterId).orElseThrow();

        if (!"FIDUCIARY_ADMIN".equals(requester.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        String email = body.get("email");
        String tenantId = requester.getTenantId();
        String displayName = companyName(tenantId);

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Worker email is required."));
        }

        email = email.trim();

        Optional<User> existingUser = userRepo.findByEmailIgnoreCase(email);

        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setRole("FIDUCIARY_WORKER");
            user.setTenantId(tenantId);
            user.setCreatedAt(LocalDateTime.now());
            userRepo.save(user);

            emailService.sendNotification(
                    email,
                    "You have been assigned as Worker for " + displayName,
                    "Hello,\n\n" +
                            "You have been assigned as a Fiduciary Worker for " + displayName + " on the DPDP Compliance Portal.\n\n" +
                            "Please log in at: http://localhost:5173\n\n" +
                            "For security, the portal will ask you to verify your email with a one-time OTP if you have not verified this account already.\n\n" +
                            "After OTP verification, you will be directed to your Worker Dashboard.\n\n" +
                            "This is a system-generated message."
            );

            return ResponseEntity.ok(Map.of("message", "Worker assigned and notified."));
        }

        Optional<PendingRoleAssignment> existingPending = pendingRepo.findByEmailIgnoreCase(email);

        PendingRoleAssignment pending = existingPending.orElseGet(PendingRoleAssignment::new);
        pending.setEmail(email);
        pending.setRole("FIDUCIARY_WORKER");
        pending.setTenantId(tenantId);
        pending.setAssignedAt(LocalDateTime.now());

        pendingRepo.save(pending);

        emailService.sendNotification(
                email,
                "You have been invited as Worker for " + displayName,
                "Hello,\n\n" +
                        "You have been assigned as a Fiduciary Worker for " + displayName + " on the DPDP Compliance Portal.\n\n" +
                        "To get started:\n" +
                        "1. Visit: http://localhost:5173\n" +
                        "2. Click Log In and sign up with this email address\n" +
                        "3. Verify your email with the one-time OTP shown in the portal\n" +
                        "4. You will be directed to your Worker Dashboard\n\n" +
                        "This invitation is linked to this email address only.\n\n" +
                        "This is a system-generated message."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Invitation email sent to " + email + ". Role will be applied on first login."
        ));
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepo.findAll());
    }
}
