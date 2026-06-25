package com.DPDP.cms.controller;

import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepo;

    @PostMapping("/sync")
    public ResponseEntity<?> syncUserProfile(@RequestBody Map<String, String> payload) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String auth0Id = jwt.getClaimAsString("sub");
            String email = payload.get("email"); // We get the email from the frontend payload

            // If the user doesn't exist, create a blank baseline profile
            if (!userRepo.existsById(auth0Id)) {
                User newUser = new User();
                newUser.setId(auth0Id);
                newUser.setEmail(email);
                newUser.setRole("GENERAL_USER");
                // tenantId remains null until a Platform Admin assigns it

                userRepo.save(newUser);
                return ResponseEntity.ok(Map.of("message", "New user provisioned."));
            }

            return ResponseEntity.ok(Map.of("message", "User already exists."));
        }

        return ResponseEntity.status(401).body("Invalid token.");
    }
}