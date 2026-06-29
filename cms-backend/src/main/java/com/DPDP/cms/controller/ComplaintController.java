package com.DPDP.cms.controller;

import com.DPDP.cms.dto.ComplaintRequest;
import com.DPDP.cms.entity.Complaint;
import com.DPDP.cms.entity.ComplianceLog;
import com.DPDP.cms.repository.ComplaintRepository;
import com.DPDP.cms.repository.ComplianceLogRepository;
import com.DPDP.cms.repository.ConsentArtifactRepository;
import com.DPDP.cms.repository.UserRepository;
import com.DPDP.cms.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ConsentArtifactRepository consentArtifactRepo;
    private final ComplianceLogRepository complianceLogRepo;

    @PostMapping
    public Complaint createComplaint(@RequestBody ComplaintRequest request) {
        Complaint complaint = Complaint.builder()
                .tenantId(request.getTenantId())
                .userId(request.getUserId())
                .subject(request.getSubject())
                .description(request.getDescription())
                .status("OPEN")
                .createdAt(LocalDateTime.now())
                .build();
        return complaintRepository.save(complaint);
    }

    // Worker Queue: Only fetches "OPEN" tickets[cite: 5]
    @GetMapping("/worker/{tenantId}")
    public List<Complaint> getWorkerQueue(@PathVariable String tenantId) {
        return complaintRepository.findByTenantIdAndStatus(tenantId, "OPEN");
    }

    // Admin Queue: Only fetches "ESCALATED" tickets[cite: 4]
    @GetMapping("/admin/{tenantId}")
    public List<Complaint> getAdminQueue(@PathVariable String tenantId) {
        return complaintRepository.findByTenantIdAndStatus(tenantId, "ESCALATED");
    }

    // Updated Status Update: Handles Escalation AND Resolution + Auditing + Email Notification
    @PutMapping("/{id}/status")
    public String updateComplaintStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal) { // 1. Add Principal to identify the worker

        String newStatus = payload.get("status");
        String message = payload.get("message");

        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus(newStatus);
        complaintRepository.save(complaint);

        // 2. Audit the Worker's Action
        ComplianceLog log = ComplianceLog.builder()
                .tenantId(complaint.getTenantId())
                .adminEmail(principal.getName()) // This captures the logged-in Worker's ID
                .action("WORKER_" + newStatus)   // Will log as WORKER_RESOLVED or WORKER_ESCALATED
                .targetIdentity(complaint.getUserId())
                .reason("Status update: " + newStatus + ". Msg: " + message)
                .timestamp(LocalDateTime.now())
                .actorId(principal.getName())
                .actorRole("WORKER") // Clearly identifies this was a worker
                .actionType(newStatus)
                .build();
        complianceLogRepo.save(log);

        // 3. If resolved, send the notification email to the user
        if ("RESOLVED".equals(newStatus) && message != null) {
            userRepository.findById(complaint.getUserId()).ifPresent(user -> {
                emailService.sendNotification(user.getEmail(), "Resolution: " + complaint.getSubject(), message);
            });
        }

        return "Complaint " + id + " updated to " + newStatus;
    }

    @Transactional
    @PatchMapping("/{id}/force-resolve")
    public ResponseEntity<String> forceResolve(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Principal principal) {

        // 2. Extract the note from the JSON payload
        String resolutionNote = payload.get("note");

        // 1. Update Complaint
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        complaint.setStatus("RESOLVED");
        complaint.setResolutionNote(resolutionNote); // 3. Use the extracted string
        complaintRepository.save(complaint);

        // 2. Audit the Admin Action
        ComplianceLog log = ComplianceLog.builder()
                .tenantId(complaint.getTenantId())
                .adminEmail(principal.getName())
                .action("FORCE_RESOLVE_COMPLAINT")
                .targetIdentity(complaint.getUserId())
                .reason("Manual resolution: " + resolutionNote)
                .timestamp(LocalDateTime.now())
                .actorId(principal.getName()) // Using the email as ID
                .actorRole("ADMIN")
                .actionType("FORCE_RESOLVE")
                .build();

        complianceLogRepo.save(log);

        // 3. Send Notification Email to the User
        userRepository.findById(complaint.getUserId()).ifPresent(targetUser -> {
            emailService.sendNotification(
                    targetUser.getEmail(),
                    "Resolution Update: " + complaint.getSubject(),
                    "Your compliance request has been resolved by an administrator.\n\nResolution Note: " + resolutionNote
            );
        });

        return ResponseEntity.ok("Complaint force-resolved, logged, and user notified.");
    }

    // ... Inject ComplianceLogRepository complianceLogRepository ...
    @Transactional
    @DeleteMapping("/{id}/purge")
    public ResponseEntity<String> purgeUserData(@PathVariable String id, Principal principal) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        String targetUserId = complaint.getUserId();

        // 1. Fetch the user's email BEFORE we start destroying data
        String userEmail = userRepository.findById(targetUserId)
                .map(user -> user.getEmail())
                .orElse(null);

        // 2. Audit the Action to Compliance Logs
        ComplianceLog log = ComplianceLog.builder()
                .tenantId(complaint.getTenantId())
                .adminEmail(principal.getName())
                .action("PURGE_USER_DATA")
                .targetIdentity(targetUserId)
                .reason("Right to be Forgotten Request")
                .timestamp(LocalDateTime.now())
                .actorId(principal.getName()) // Using the email as ID
                .actorRole("ADMIN")
                .actionType("PURGE_USER_DATA")
                .build();
        complianceLogRepo.save(log);

        // 3. Destroy the Data
        consentArtifactRepo.deleteByUserIdAndTenantId(targetUserId, complaint.getTenantId());
        complaintRepository.deleteById(id);

        // 4. Send the Confirmation Email
        if (userEmail != null) {
            emailService.sendNotification(
                    userEmail,
                    "Data Erasure Confirmation: " + complaint.getSubject(),
                    "Your request to invoke the Right to be Forgotten has been successfully executed.\n\n"
                            + "All associated consent records and personal data tied to this specific tenant have been permanently purged from our active systems."
            );
        } else {
            System.err.println("WARNING: Data purged, but could not notify user because email was not found for ID: " + targetUserId);
        }
        return ResponseEntity.ok("Data purged, logged, and user notified.");
    }
}