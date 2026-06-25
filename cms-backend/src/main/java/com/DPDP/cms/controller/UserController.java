package com.DPDP.cms.controller;

import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;

    // -------------------------------------------------------
    // Called by App.jsx on every login
    // Creates user in DB if new, always returns their role
    // -------------------------------------------------------
    @PostMapping("/sync")
    public ResponseEntity<?> syncUser(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getClaimAsString("sub");
        String email = body.get("email");

        // Create user if first time logging in
        if (!userRepo.existsById(userId)) {
            User newUser = User.builder()
                    .id(userId)
                    .email(email)
                    .role("GENERAL_USER")
                    .build();
            userRepo.save(newUser);
        }

        // Always return their current role so frontend can redirect
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
    // ADMIN ONLY — Assign Fiduciary Admin role to a user
    // Called from Admin Panel > Company Management
    // -------------------------------------------------------
    @Transactional
    @PutMapping("/admin/assign-fiduciary")
    public ResponseEntity<?> assignFiduciaryAdmin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String tenantId = body.get("tenantId");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found. They must log in at least once first."));

        user.setRole("FIDUCIARY_ADMIN");
        user.setTenantId(tenantId);
        userRepo.save(user);

        return ResponseEntity.ok(Map.of("message", "User promoted to Fiduciary Admin for " + tenantId));
    }

    // -------------------------------------------------------
    // FIDUCIARY ADMIN ONLY — Assign Worker role to a user
    // Called from Fiduciary Dashboard > Worker Access tab
    // Fiduciary Admin can only assign workers to THEIR tenant
    // -------------------------------------------------------
    @Transactional
    @PutMapping("/fiduciary/assign-worker")
    public ResponseEntity<?> assignWorker(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal Jwt jwt) {

        // Get the fiduciary admin's own tenantId from DB
        String requesterId = jwt.getClaimAsString("sub");
        User requester = userRepo.findById(requesterId).orElseThrow();

        // Security check — only FIDUCIARY_ADMIN can call this
        if (!"FIDUCIARY_ADMIN".equals(requester.getRole())) {
            return ResponseEntity.status(403).body(Map.of("error", "Access denied"));
        }

        String email = body.get("email");

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found. They must log in at least once first."));

        // Worker gets same tenantId as the fiduciary admin assigning them
        user.setRole("FIDUCIARY_WORKER");
        user.setTenantId(requester.getTenantId());
        userRepo.save(user);

        return ResponseEntity.ok(Map.of("message", "User assigned as Worker for " + requester.getTenantId()));
    }

    // -------------------------------------------------------
    // ADMIN ONLY — Get all users (for user management UI)
    // -------------------------------------------------------
    @GetMapping("/admin/all")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepo.findAll());
    }
}