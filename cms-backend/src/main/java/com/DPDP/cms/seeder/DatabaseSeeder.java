package com.DPDP.cms.seeder;

import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.entity.PendingRoleAssignment;
import com.DPDP.cms.repository.NotificationLogRepository;
import com.DPDP.cms.repository.PendingRoleAssignmentRepository;
import com.DPDP.cms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final NotificationLogRepository notificationRepo;
    private final UserRepository userRepo;
    private final PendingRoleAssignmentRepository pendingRepo;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Override
    public void run(String... args) throws Exception {

        // -------------------------------------------------------
        // 1. ADMIN SEEDING
        // Runs on every fresh DB — creates pending Admin assignment
        // so first login with adminEmail gets ADMIN role automatically
        // -------------------------------------------------------
        boolean adminExists = userRepo.findAll().stream()
                .anyMatch(u -> "ADMIN".equals(u.getRole()));

        if (!adminExists && pendingRepo.findByEmail(adminEmail).isEmpty()) {
            PendingRoleAssignment pending = PendingRoleAssignment.builder()
                    .email(adminEmail)
                    .role("ADMIN")
                    .tenantId(null)
                    .assignedAt(LocalDateTime.now())
                    .build();
            pendingRepo.save(pending);

            System.out.println("====================================================");
            System.out.println(" DPDP CMS — First Run Setup");
            System.out.println(" Admin email configured: " + adminEmail);
            System.out.println(" Log in with this email to activate Admin access.");
            System.out.println("====================================================");
        }

        // -------------------------------------------------------
        // 2. NOTIFICATION LOG SEEDING (your existing code)
        // -------------------------------------------------------
        if (notificationRepo.count() == 0) {

            System.out.println("Seeding Notification Logs for presentation...");

            List<NotificationLog> initialLogs = List.of(
                    NotificationLog.builder()
                            .messageId("msg_" + UUID.randomUUID().toString().substring(0, 8))
                            .recipient("compliance.officer@alpha-corp.com")
                            .status(NotificationLog.NotificationStatus.SENT)
                            .timestamp(LocalDateTime.now().minusMinutes(12))
                            .build(),

                    NotificationLog.builder()
                            .messageId("msg_" + UUID.randomUUID().toString().substring(0, 8))
                            .recipient("user_77a9b@gmail.com")
                            .status(NotificationLog.NotificationStatus.FAILED)
                            .timestamp(LocalDateTime.now().minusHours(1))
                            .errorLog("SMTP 550: Mailbox unavailable or access denied.")
                            .build(),

                    NotificationLog.builder()
                            .messageId("msg_" + UUID.randomUUID().toString().substring(0, 8))
                            .recipient("data.principal.404@yahoo.com")
                            .status(NotificationLog.NotificationStatus.PENDING)
                            .timestamp(LocalDateTime.now().minusSeconds(45))
                            .build(),

                    NotificationLog.builder()
                            .messageId("msg_" + UUID.randomUUID().toString().substring(0, 8))
                            .recipient("admin.team@fiduciary.net")
                            .status(NotificationLog.NotificationStatus.SENT)
                            .timestamp(LocalDateTime.now().minusDays(1))
                            .build()
            );

            notificationRepo.saveAll(initialLogs);
            System.out.println("Notification Logs seeded successfully!");
        }
    }
}