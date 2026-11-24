package com.shed.teamden.inbox.controller;

import com.shed.teamden.inbox.dto.CreateInboxItemRequestDto;
import com.shed.teamden.inbox.dto.InboxItemDto;
import com.shed.teamden.inbox.dto.InboxResponseDto;
import com.shed.teamden.inbox.service.InboxService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/inbox")
@RequiredArgsConstructor
public class InboxController {

    private final InboxService inboxService;

    @GetMapping
    public ResponseEntity<InboxResponseDto> getInbox(
            @RequestParam(name = "tab", defaultValue = "ALL") String tab,
            @RequestParam(name = "filter", defaultValue = "ALL") String filter,
            @RequestParam(name = "activeItemId", required = false) UUID activeItemId) {
        InboxResponseDto response = inboxService.getInbox(tab, filter, activeItemId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<InboxItemDto> createInboxItem(@RequestBody CreateInboxItemRequestDto request) {
        InboxItemDto created = inboxService.createInboxItem(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<InboxItemDto> markRead(@PathVariable UUID id) {
        return ResponseEntity.ok(inboxService.markAsRead(id));
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllRead() {
        inboxService.markAllAsRead();
        return ResponseEntity.ok(Map.of("message", "All inbox items marked as read"));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<InboxItemDto> toggleArchive(@PathVariable UUID id) {
        return ResponseEntity.ok(inboxService.toggleArchive(id));
    }

    @PutMapping("/{id}/snooze")
    public ResponseEntity<InboxItemDto> toggleSnooze(@PathVariable UUID id) {
        return ResponseEntity.ok(inboxService.toggleSnooze(id));
    }

    @PutMapping("/{id}/mute")
    public ResponseEntity<InboxItemDto> toggleMute(@PathVariable UUID id) {
        return ResponseEntity.ok(inboxService.toggleMute(id));
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<InboxItemDto> executeAction(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        String action = body != null ? body.get("action") : "VIEW";
        return ResponseEntity.ok(inboxService.executeAction(id, action));
    }
}
