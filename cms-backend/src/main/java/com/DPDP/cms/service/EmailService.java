package com.DPDP.cms.service;

import org.springframework.stereotype.Service;

@Service
public class EmailService {
    public void sendNotification(String userEmail, String subject, String message) {
        // Log the email action for the MVP.
        // This is where you will add your SendGrid/Mailgun SDK code later.
        System.out.println("=========================================");
        System.out.println("EMAIL SENT TO: " + userEmail);
        System.out.println("SUBJECT: " + subject);
        System.out.println("BODY: " + message);
        System.out.println("=========================================");
    }
}
