package com.DPDP.cms.service;

import com.DPDP.cms.entity.NotificationLog;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailDeliveryResult sendNotification(String toEmail, String subject, String body) {
        String messageId = "msg_" + UUID.randomUUID().toString().substring(0, 8);

        if (toEmail == null || toEmail.isBlank() || toEmail.equals("user@example.com")) {
            String error = "No valid recipient address provided.";
            System.err.println("Cannot send email: " + error);
            return new EmailDeliveryResult(messageId, NotificationLog.NotificationStatus.FAILED, error);
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body + "\n\n--\nDPDP Consent Management Platform");

            mailSender.send(message);
            System.out.println("Real Email sent successfully to: " + toEmail);

            return new EmailDeliveryResult(messageId, NotificationLog.NotificationStatus.SENT, null);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            return new EmailDeliveryResult(messageId, NotificationLog.NotificationStatus.FAILED, e.getMessage());
        }
    }

    public record EmailDeliveryResult(
            String messageId,
            NotificationLog.NotificationStatus status,
            String errorLog
    ) {}
}
