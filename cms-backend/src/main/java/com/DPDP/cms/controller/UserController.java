package com.DPDP.cms.controller;

import com.DPDP.cms.entity.PendingRoleAssignment;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.PendingRoleAssignmentRepository;
import com.DPDP.cms.repository.UserRepository;
import com.DPDP.cms.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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
    private final EmailService emailService;

    // -------------------------------------------------------
    // Called by App.jsx on every login
    // Creates user in DB if new
    // Checks pending_role_assignments and applies role if found
    // -------------------------------------------------------
    @Transactional
    @PostMapping("/sync")
    public ResponseEntity<?> syncUser(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getClaimAsString("sub");
        String email = body.get("email");

        if (!userRepo.existsById(userId)) {
            // Check if there's a pending role assignment for this email
            Optional<PendingRoleAssignment> pending = pendingRepo.findByEmail(email);

            User newUser;
            if (pending.isPresent()) {
                // Apply the pre-assigned role automatically
                newUser = User.builder()
                        .id(userId)
                        .email(email)
                        .role(pending.get().getRole())
                        .tenantId(pending.get().getTenantId())
                        .build();
                // Clean up the pending record
                pendingRepo.deleteByEmail(email);
            } else {
                // Default — general user
                newUser = User.builder()
                        .id(userId)
                        .email(email)
                        .role("GENERAL_USER")
                        .build();
            }
            userRepo.save(newUser);
        }

        User user = userRepo.findById(userId).orElseThrow();
        return ResponseEntity.ok(Map.of(
                "role", user.getRole(),
                "tenantId", user.getTenantId() != null ? user.getTenantId() : ""
        ));
    }

    // -------------------------------------------------------
    // Called by ProtectedRoute to verify role on page load
    // -------------------------------------------------------
    @GetMapping("/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        User user = userRepo.findById(userId).orElseThrow();
        return ResponseEntity.ok(Map.of(
                "role", user.getRole(),
                "tenantId", user.getTenantId() != null ? user.getTenantId() : ""
        ));
    }

    // -------------------------------------------------------
    // ADMIN ONLY — Assign Fiduciary Admin role
    // If user exists in DB → update role directly
    // If not → save to pending_role_assignments + send email
    // -------------------------------------------------------
    @Transactional
    @PutMapping("/admin/assign-fiduciary")
    public ResponseEntity<?> assignFiduciaryAdmin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String tenantId = body.get("tenantId");
        String tenantName = body.get("tenantName");
        String displayName = tenantName != null ? tenantName : tenantId;

        // Case 1 — User already exists in DB (has logged in before)
        Optional<User> existingUser = userRepo.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setRole("FIDUCIARY_ADMIN");
            user.setTenantId(tenantId);
            userRepo.save(user);

            emailService.sendNotification(
                    email,
                    "You have been assigned as Fiduciary Admin — DPDP Portal",
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

        // Case 2 — User hasn't signed up yet
        // Save pending assignment so it's applied on their first login
        PendingRoleAssignment pending = PendingRoleAssignment.builder()
                .email(email)
                .role("FIDUCIARY_ADMIN")
                .tenantId(tenantId)
                .assignedAt(LocalDateTime.now())
                .build();
        pendingRepo.save(pending);

        // Send invitation email
        emailService.sendNotification(
                email,
                "You have been invited as Fiduciary Admin — DPDP Portal",
                "Hello,\n\n" +
                        "You have been assigned as the Fiduciary Admin for " + displayName + " on the DPDP Compliance Portal.\n\n" +
                        "To get started:\n" +
                        "1. Visit: http://localhost:5173\n" +
                        "2. Click 'Log In' and sign up with this email address\n" +
                        "3. You will be automatically directed to your Fiduciary Dashboard\n\n" +
                        "No additional steps needed — your role is pre-configured.\n\n" +
                        "This is a system-generated message."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Invitation email sent to " + email + ". Role will be applied on first login."
        ));
    }

    // -------------------------------------------------------
    // FIDUCIARY ADMIN ONLY — Assign Worker role
    // -------------------------------------------------------
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

        // Case 1 — User already exists in DB
        Optional<User> existingUser = userRepo.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setRole("FIDUCIARY_WORKER");
            user.setTenantId(requester.getTenantId());
            userRepo.save(user);

            emailService.sendNotification(
                    email,
                    "You have been assigned as a Worker — DPDP Portal",
                    "Hello,\n\n" +
                            "You have been granted Worker access on the DPDP Compliance Portal.\n\n" +
                            "Please log in at: http://localhost:5173\n\n" +
                            "You will be automatically directed to your Worker Dashboard.\n\n" +
                            "This is a system-generated message."
            );

            return ResponseEntity.ok(Map.of("message", "Worker assigned and notified."));
        }

        // Case 2 — User hasn't signed up yet
        PendingRoleAssignment pending = PendingRoleAssignment.builder()
                .email(email)
                .role("FIDUCIARY_WORKER")
                .tenantId(requester.getTenantId())
                .assignedAt(LocalDateTime.now())
                .build();
        pendingRepo.save(pending);

        emailService.sendNotification(
                email,
                "You have been invited as a Worker — DPDP Portal",
                "Hello,\n\n" +
                        "You have been assigned as a Fiduciary Worker on the DPDP Compliance Portal.\n\n" +
                        "To get started:\n" +
                        "1. Visit: http://localhost:5173\n" +
                        "2. Click 'Log In' and sign up with this email address\n" +
                        "3. You will be automatically directed to your Worker Dashboard\n\n" +
                        "No additional steps needed — your role is pre-configured.\n\n" +
                        "This is a system-generated message."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Invitation email sent to " + email + ". Role will be applied on first login."
        ));
    }

    // -------------------------------------------------------
    // ADMIN ONLY — Get all users for User Management UI
    // -------------------------------------------------------
    @GetMapping("/admin/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepo.findAll());
    }
}