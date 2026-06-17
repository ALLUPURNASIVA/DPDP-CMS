package com.DPDP.cms.controller;

import com.DPDP.cms.service.DataErasureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final DataErasureService dataErasureService;

    @DeleteMapping("/forget-me")
    public ResponseEntity<Void> rightToBeForgotten(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail
    ) {
        dataErasureService.executeRightToBeForgotten(userId, userEmail);
        return ResponseEntity.noContent().build();
    }
}