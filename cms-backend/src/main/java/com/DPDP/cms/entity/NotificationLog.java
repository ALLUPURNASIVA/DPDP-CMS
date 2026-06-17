package com.DPDP.cms.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // The unique transaction ID given by the email provider (e.g., AWS SES or SendGrid)
    @Column(name = "message_id", unique = true)
    private String messageId;

    private String recipient;

    @Enumerated(EnumType.STRING)
    private NotificationStatus status;

    private LocalDateTime timestamp;

    // We use TEXT here because SMTP error traces can be very long
    @Column(name = "error_log", columnDefinition = "TEXT")
    private String errorLog;

    public enum NotificationStatus {
        PENDING,
        SENT,
        FAILED
    }
}