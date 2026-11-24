package com.shed.teamden.notification.controller;

import com.shed.teamden.notification.dto.CreateNotificationRequestDto;
import com.shed.teamden.notification.dto.NotificationDto;
import com.shed.teamden.notification.dto.NotificationResponseDto;
import com.shed.teamden.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<NotificationResponseDto> getNotifications(
            @RequestParam(value = "tab", defaultValue = "ALL") String tab,
            @RequestParam(value = "filter", defaultValue = "ALL") String filter,
            @RequestParam(value = "activeItemId", required = false) UUID activeItemId
    ) {
        NotificationResponseDto response = notificationService.getNotifications(tab, filter, activeItemId);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<NotificationDto> createNotification(@RequestBody CreateNotificationRequestDto request) {
        NotificationDto created = notificationService.createNotification(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable UUID id) {
        NotificationDto updated = notificationService.markAsRead(id);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PutMapping("/{id}/archive")
    public ResponseEntity<NotificationDto> archive(@PathVariable UUID id) {
        NotificationDto updated = notificationService.archive(id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/snooze")
    public ResponseEntity<NotificationDto> snooze(@PathVariable UUID id) {
        NotificationDto updated = notificationService.snooze(id);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/mute")
    public ResponseEntity<NotificationDto> mute(@PathVariable UUID id) {
        NotificationDto updated = notificationService.mute(id);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<NotificationDto> executeAction(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, String> payload
    ) {
        String action = (payload != null && payload.containsKey("action")) ? payload.get("action") : "REVIEW";
        NotificationDto updated = notificationService.executeAction(id, action);
        return ResponseEntity.ok(updated);
    }
}
