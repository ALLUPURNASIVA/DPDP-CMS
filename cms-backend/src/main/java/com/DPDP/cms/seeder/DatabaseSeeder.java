package com.DPDP.cms.seeder;

import com.DPDP.cms.entity.NotificationLog;
import com.DPDP.cms.repository.NotificationLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final NotificationLogRepository notificationRepo;

    @Override
    public void run(String... args) throws Exception {
        // Only run this seeder if the table is completely empty
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