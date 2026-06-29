package com.DPDP.cms.controller;

import com.DPDP.cms.entity.GeneralUserOtp;
import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.repository.GeneralUserOtpRepository;
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.UserRepository;
import com.DPDP.cms.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/user-otp")
@RequiredArgsConstructor
public class GeneralUserOtpController {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final Set<String> OTP_REQUIRED_ROLES = Set.of("GENERAL_USER", "FIDUCIARY_WORKER");

    private final GeneralUserOtpRepository otpRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final NotificationLogRepository notificationRepo;

    @GetMapping("/status")
    public ResponseEntity<?> status(@AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        String email = jwt.getClaimAsString("email");

        if (email == null || email.isBlank()) {
            email = userRepo.findById(userId)
                    .map(user -> user.getEmail())
                    .orElse(null);
        }

        String role = userRepo.findById(userId)
                .map(user -> user.getRole())
                .orElse("GENERAL_USER");

        boolean requiresOtp = List.of("GENERAL_USER", "FIDUCIARY_WORKER").contains(role);

        boolean verified = !requiresOtp || (
                email != null && otpRepo.existsByUserIdAndEmailAndVerifiedAtIsNotNull(userId, email)
        );

        return ResponseEntity.ok(Map.of(
                "requiresOtp", requiresOtp,
                "verified", verified
        ));
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@RequestBody(required = false) Map<String, String> payload,
                                     @AuthenticationPrincipal Jwt jwt) {
        String userId = jwt.getClaimAsString("sub");
        String email = jwt.getClaimAsString("email");
        if ((email == null || email.isBlank()) && payload != null) {
            email = payload.get("email");
        }
        if ((email == null || email.isBlank())) {
            email = userRepo.findById(userId).map(user -> user.getEmail()).orElse(null);
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "No email found on authenticated profile."
            ));
        }

        String role = userRepo.findById(userId)
                .map(user -> user.getRole())
                .orElse("GENERAL_USER");

        if (!OTP_REQUIRED_ROLES.contains(role)) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "OTP verification is not required for this role."
            ));
        }

        if (otpRepo.existsByUserIdAndEmailAndVerifiedAtIsNotNull(userId, email)) {
            return ResponseEntity.ok(Map.of(
                    "message", "Account already OTP verified."
            ));
        }

        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));

        GeneralUserOtp record = GeneralUserOtp.builder()
                .userId(userId)
                .email(email)
                .otpHash(hash(otp))
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        otpRepo.save(record);

        EmailService.EmailDeliveryResult result = emailService.sendNotification(
                email,
                "Your DPDP Portal OTP",
                "Your DPDP Portal OTP is: " + otp + "\n\nThis OTP is valid for 10 minutes."
        );

        notificationRepo.save(NotificationLog.builder()
                .messageId(result.messageId())
                .recipient(email)
                .status(result.status())
                .timestamp(LocalDateTime.now())
                .errorLog(result.errorLog())
                .build());

        if (result.status() == NotificationLog.NotificationStatus.FAILED) {
            return ResponseEntity.status(502).body(Map.of(
                    "error", "Failed to send OTP email: " + result.errorLog()
            ));
        }

        return ResponseEntity.ok(Map.of(
                "message", "OTP sent successfully."
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getClaimAsString("sub");
        String email = jwt.getClaimAsString("email");
        String otp = payload.get("otp");
        if ((email == null || email.isBlank()) && payload != null) {
            email = payload.get("email");
        }
        if ((email == null || email.isBlank())) {
            email = userRepo.findById(userId).map(user -> user.getEmail()).orElse(null);
        }

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "No email found on authenticated profile."
            ));
        }

        if (otp == null || !otp.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Enter a valid 6-digit OTP."
            ));
        }

        GeneralUserOtp record = otpRepo
                .findTopByUserIdAndEmailAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                        userId,
                        email,
                        LocalDateTime.now()
                )
                .orElse(null);

        if (record == null || !record.getOtpHash().equals(hash(otp))) {
            return ResponseEntity.status(400).body(Map.of(
                    "error", "Invalid or expired OTP."
            ));
        }

        record.setUsed(true);
        record.setVerifiedAt(LocalDateTime.now());
        otpRepo.save(record);

        return ResponseEntity.ok(Map.of(
                "verified", true,
                "message", "OTP verified successfully."
        ));
    }

    private String hash(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to hash OTP", e);
        }
    }
}
