package com.DPDP.cms.controller;

import com.DPDP.cms.dto.ComplaintRequest;
import com.DPDP.cms.entity.Complaint;
import com.DPDP.cms.repository.ComplaintRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintRepository complaintRepository;

    @PostMapping
    public Complaint createComplaint(
            @RequestBody ComplaintRequest request) {

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
}