package com.DPDP.cms.controller;

import com.DPDP.cms.entity.PendingRoleAssignment;
import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.PendingRoleAssignmentRepository;
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
    private final EmailService emailService;

    @Value("#{'${platform.admin.emails:}'.split(',')}")
    private List<String> platformAdminEmails;

    private boolean isPlatformAdminEmail(String email) {
        return email != null && platformAdminEmails.stream()
                .map(String::trim)
                .filter(adminEmail -> !adminEmail.isBlank())
                .anyMatch(adminEmail -> adminEmail.equalsIgnoreCase(email));
    }

    @Transactional
    @PostMapping("/sync")
    public ResponseEntity<?> syncUser(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getClaimAsString("sub");
        String email = body.get("email");
        boolean platformAdmin = isPlatformAdminEmail(email);

        if (!userRepo.existsById(userId)) {
            Optional<PendingRoleAssignment> pending = pendingRepo.findByEmail(email);

            User newUser;
            if (platformAdmin) {
                newUser = User.builder()
                        .id(userId)
                        .email(email)
                        .role("ADMIN")
                        .tenantId(null)
                        .build();
            } else if (pending.isPresent()) {
                newUser = User.builder()
                        .id(userId)
                        .email(email)
                        .role(pending.get().getRole())
                        .tenantId(pending.get().getTenantId())
                        .build();

                pendingRepo.deleteByEmail(email);
            } else {
                newUser = User.builder()
                        .id(userId)
                        .email(email)
                        .role("GENERAL_USER")
                        .build();
            }

            userRepo.save(newUser);
        }

        User user = userRepo.findById(userId).orElseThrow();

        if (platformAdmin && !"ADMIN".equals(user.getRole())) {
            user.setRole("ADMIN");
            user.setTenantId(null);
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
        String displayName = tenantName != null ? tenantName : tenantId;

        Optional<User> existingUser = userRepo.findByEmail(email);
        if (existingUser.isPresent()) {
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

        PendingRoleAssignment pending = PendingRoleAssignment.builder()
                .email(email)
                .role("FIDUCIARY_ADMIN")
                .tenantId(tenantId)
                .assignedAt(LocalDateTime.now())
                .build();
        pendingRepo.save(pending);

        emailService.sendNotification(
                email,
                "You have been invited as Fiduciary Admin - DPDP Portal",
                "Hello,\n\n" +
                        "You have been assigned as the Fiduciary Admin for " + displayName + " on the DPDP Compliance Portal.\n\n" +
                        "To get started:\n" +
                        "1. Visit: http://localhost:5173\n" +
                        "2. Click 'Log In' and sign up with this email address\n" +
                        "3. You will be automatically directed to your Fiduciary Dashboard\n\n" +
                        "No additional steps needed - your role is pre-configured.\n\n" +
                        "This is a system-generated message."
        );

        return ResponseEntity.ok(Map.of(
                "message", "Invitation email sent to " + email + ". Role will be applied on first login."
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

        Optional<User> existingUser = userRepo.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            user.setRole("FIDUCIARY_WORKER");
            user.setTenantId(requester.getTenantId());
            userRepo.save(user);

            emailService.sendNotification(
                    email,
                    "You have been assigned as a Worker - DPDP Portal",
                    "Hello,\n\n" +
                            "You have been granted Worker access on the DPDP Compliance Portal.\n\n" +
                            "Please log in at: http://localhost:5173\n\n" +
                            "You will be automatically directed to your Worker Dashboard.\n\n" +
                            "This is a system-generated message."
            );

            return ResponseEntity.ok(Map.of("message", "Worker assigned and notified."));
        }

        PendingRoleAssignment pending = PendingRoleAssignment.builder()
                .email(email)
                .role("FIDUCIARY_WORKER")
                .tenantId(requester.getTenantId())
                .assignedAt(LocalDateTime.now())
                .build();
        pendingRepo.save(pending);

        emailService.sendNotification(
                email,
                "You have been invited as a Worker - DPDP Portal",
                "Hello,\n\n" +
                        "You have been assigned as a Fiduciary Worker on the DPDP Compliance Portal.\n\n" +
                        "To get started:\n" +
                        "1. Visit: http://localhost:5173\n" +
                        "2. Click 'Log In' and sign up with this email address\n" +
                        "3. You will be automatically directed to your Worker Dashboard\n\n" +
                        "No additional steps needed - your role is pre-configured.\n\n" +
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