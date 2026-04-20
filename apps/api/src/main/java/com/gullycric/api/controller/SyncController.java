package com.gullycric.api.controller;

import com.gullycric.api.dto.SyncRequestDTO;
import com.gullycric.api.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For MVP frontend access
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    public ResponseEntity<?> syncOutbox(@RequestBody SyncRequestDTO request) {
        syncService.processSyncPayload(request);
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "message", "Successfully synced " + (request.getOutbox() != null ? request.getOutbox().size() : 0) + " operations"
        ));
    }
}
