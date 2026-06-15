package com.DPDP.cms.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendNotification(String toEmail, String subject, String body) {
        // Fallback catch just in case Auth0 doesn't provide an email
        if (toEmail == null || toEmail.equals("user@example.com")) {
            System.err.println("Cannot send email: No valid recipient address provided.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body + "\n\n--\nDPDP Consent Management Platform");

            mailSender.send(message);
            System.out.println("Real Email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
        }
    }
}