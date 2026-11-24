package com.shed.teamden.notification.service;

import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.notification.dto.CreateNotificationRequestDto;
import com.shed.teamden.notification.dto.NotificationCountsDto;
import com.shed.teamden.notification.dto.NotificationDto;
import com.shed.teamden.notification.dto.NotificationResponseDto;
import com.shed.teamden.notification.entity.Notification;
import com.shed.teamden.notification.repository.NotificationRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationResponseDto getNotifications(String tab, String filter, UUID activeItemId) {
        Organization organization = resolveCurrentOrganization();

        List<Notification> allOrgNotifications = notificationRepository
                .findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(organization.getId());

        // Calculate counts
        long allCount = allOrgNotifications.stream().filter(n -> !n.isArchived()).count();
        long needsActionCount = allOrgNotifications.stream()
                .filter(n -> !n.isArchived() && "NEEDS_ACTION".equalsIgnoreCase(n.getCategory()))
                .count();
        long updatesCount = allOrgNotifications.stream()
                .filter(n -> !n.isArchived() && "UPDATES".equalsIgnoreCase(n.getCategory()))
                .count();
        long archivedCount = allOrgNotifications.stream().filter(n -> Boolean.TRUE.equals(n.isArchived())).count();
        long unreadCount = allOrgNotifications.stream()
                .filter(n -> !n.isArchived() && !n.isRead())
                .count();
        long mentionsCount = allOrgNotifications.stream()
                .filter(n -> !n.isArchived() && ("MENTIONS".equalsIgnoreCase(n.getFilterType()) || "MENTION".equalsIgnoreCase(n.getItemType())))
                .count();
        long followingCount = allOrgNotifications.stream()
                .filter(n -> !n.isArchived() && "FOLLOWING".equalsIgnoreCase(n.getFilterType()))
                .count();

        NotificationCountsDto counts = NotificationCountsDto.builder()
                .all(allCount)
                .needsAction(needsActionCount)
                .updates(updatesCount)
                .archived(archivedCount)
                .unread(unreadCount)
                .mentions(mentionsCount)
                .following(followingCount)
                .build();

        // Filter list based on selected Tab
        List<Notification> tabFiltered = allOrgNotifications.stream().filter(n -> {
            if ("ARCHIVED".equalsIgnoreCase(tab)) {
                return n.isArchived();
            }
            if (n.isArchived()) {
                return false;
            }
            if ("NEEDS_ACTION".equalsIgnoreCase(tab)) {
                return "NEEDS_ACTION".equalsIgnoreCase(n.getCategory());
            }
            if ("UPDATES".equalsIgnoreCase(tab)) {
                return "UPDATES".equalsIgnoreCase(n.getCategory());
            }
            return true; // "ALL"
        }).collect(Collectors.toList());

        // Apply secondary filter (ALL, UNREAD, MENTIONS, FOLLOWING)
        List<Notification> filteredList = tabFiltered.stream().filter(n -> {
            if (filter == null || filter.isBlank() || "ALL".equalsIgnoreCase(filter)) {
                return true;
            }
            if ("UNREAD".equalsIgnoreCase(filter)) {
                return !n.isRead();
            }
            if ("MENTIONS".equalsIgnoreCase(filter)) {
                return "MENTIONS".equalsIgnoreCase(n.getFilterType()) || "MENTION".equalsIgnoreCase(n.getItemType());
            }
            if ("FOLLOWING".equalsIgnoreCase(filter)) {
                return "FOLLOWING".equalsIgnoreCase(n.getFilterType());
            }
            return true;
        }).collect(Collectors.toList());

        // Group into Sections
        List<NotificationDto> attentionQueue = new ArrayList<>();
        List<NotificationDto> updatesToday = new ArrayList<>();
        List<NotificationDto> updatesEarlier = new ArrayList<>();

        for (Notification n : filteredList) {
            NotificationDto dto = mapToDto(n);
            if ("ATTENTION_QUEUE".equalsIgnoreCase(n.getSection())) {
                attentionQueue.add(dto);
            } else if ("REGISTER_TODAY".equalsIgnoreCase(n.getSection())) {
                updatesToday.add(dto);
            } else {
                updatesEarlier.add(dto);
            }
        }

        // Active item resolution (for Action in Focus)
        NotificationDto activeItem = null;
        if (activeItemId != null) {
            activeItem = allOrgNotifications.stream()
                    .filter(n -> n.getId().equals(activeItemId))
                    .findFirst()
                    .map(this::mapToDto)
                    .orElse(null);
        }
        if (activeItem == null && !attentionQueue.isEmpty()) {
            activeItem = attentionQueue.get(0);
        } else if (activeItem == null && !updatesToday.isEmpty()) {
            activeItem = updatesToday.get(0);
        } else if (activeItem == null && !updatesEarlier.isEmpty()) {
            activeItem = updatesEarlier.get(0);
        } else if (activeItem == null && !allOrgNotifications.isEmpty()) {
            activeItem = mapToDto(allOrgNotifications.get(0));
        }

        return NotificationResponseDto.builder()
                .attentionQueue(attentionQueue)
                .updatesToday(updatesToday)
                .updatesEarlier(updatesEarlier)
                .activeItem(activeItem)
                .counts(counts)
                .build();
    }

    @Transactional
    public NotificationDto markAsRead(UUID id) {
        Organization organization = resolveCurrentOrganization();
        Notification notification = notificationRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional
    public void markAllAsRead() {
        Organization organization = resolveCurrentOrganization();
        List<Notification> unread = notificationRepository
                .findByOrganizationIdAndIsArchivedFalseOrderBySortOrderAscCreatedAtDesc(organization.getId())
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());

        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public NotificationDto archive(UUID id) {
        Organization organization = resolveCurrentOrganization();
        Notification notification = notificationRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setArchived(!notification.isArchived());
        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional
    public NotificationDto snooze(UUID id) {
        Organization organization = resolveCurrentOrganization();
        Notification notification = notificationRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setSnoozed(!notification.isSnoozed());
        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional
    public NotificationDto mute(UUID id) {
        Organization organization = resolveCurrentOrganization();
        Notification notification = notificationRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setMuted(!notification.isMuted());
        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional
    public NotificationDto executeAction(UUID id, String action) {
        Organization organization = resolveCurrentOrganization();
        Notification notification = notificationRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        notification.setRead(true);
        if ("APPROVE".equalsIgnoreCase(action) || "ACKNOWLEDGE".equalsIgnoreCase(action)) {
            notification.setArchived(true);
        }
        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    @Transactional
    public NotificationDto createNotification(CreateNotificationRequestDto req) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        Instant now = Instant.now();
        Notification notification = Notification.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .recipient(currentUser)
                .title(req.getTitle() != null ? req.getTitle().trim() : "Notification")
                .subtitle(req.getSubtitle() != null ? req.getSubtitle().trim() : "")
                .quote(req.getQuote() != null ? req.getQuote().trim() : null)
                .description(req.getDescription() != null ? req.getDescription().trim() : "")
                .category(req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim() : "UPDATES")
                .section(req.getSection() != null && !req.getSection().isBlank() ? req.getSection().trim() : "REGISTER_TODAY")
                .filterType(req.getFilterType() != null && !req.getFilterType().isBlank() ? req.getFilterType().trim() : "ALL")
                .itemType(req.getItemType() != null && !req.getItemType().isBlank() ? req.getItemType().trim() : "UPDATE")
                .projectTitle(req.getProjectTitle() != null ? req.getProjectTitle().trim() : "")
                .requesterName(req.getRequesterName() != null ? req.getRequesterName().trim() : currentUser.getFullName())
                .requesterInitials(req.getRequesterInitials() != null ? req.getRequesterInitials().trim() : "TD")
                .supportingDocTitle(req.getSupportingDocTitle() != null ? req.getSupportingDocTitle().trim() : "")
                .dueDateStr(req.getDueDateStr() != null ? req.getDueDateStr().trim() : "")
                .actionLabel(req.getActionLabel() != null ? req.getActionLabel().trim() : "View")
                .actionUrl(req.getActionUrl() != null ? req.getActionUrl().trim() : "/pages/inbox/inbox.html")
                .isRead(false)
                .isArchived(false)
                .sortOrder(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        notification = notificationRepository.save(notification);
        return mapToDto(notification);
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .section(n.getSection())
                .category(n.getCategory())
                .filterType(n.getFilterType())
                .itemType(n.getItemType())
                .title(n.getTitle())
                .subtitle(n.getSubtitle())
                .quote(n.getQuote())
                .description(n.getDescription())
                .projectTitle(n.getProjectTitle())
                .projectId(n.getProjectId())
                .requesterName(n.getRequesterName())
                .requesterInitials(n.getRequesterInitials())
                .supportingDocTitle(n.getSupportingDocTitle())
                .supportingDocId(n.getSupportingDocId())
                .dueDateStr(n.getDueDateStr())
                .actionLabel(n.getActionLabel())
                .actionUrl(n.getActionUrl())
                .isRead(n.isRead())
                .isArchived(n.isArchived())
                .isSnoozed(n.isSnoozed())
                .isMuted(n.isMuted())
                .sortOrder(n.getSortOrder())
                .timeAgo(formatTimeAgo(n.getCreatedAt()))
                .createdAt(n.getCreatedAt())
                .build();
    }

    private String formatTimeAgo(Instant time) {
        if (time == null) return "";
        long minutes = ChronoUnit.MINUTES.between(time, Instant.now());
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " minutes ago";
        long hours = ChronoUnit.HOURS.between(time, Instant.now());
        if (hours < 24) return hours + (hours == 1 ? " hour ago" : " hours ago");
        long days = ChronoUnit.DAYS.between(time, Instant.now());
        if (days == 1) return "Yesterday";
        return days + " days ago";
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            if (userOpt.get().getActiveOrganizationId() != null) {
                return organizationRepository.findById(userOpt.get().getActiveOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException("Active organization not found: " + userOpt.get().getActiveOrganizationId()));
            }
            throw new UnauthorizedException("User has no active organization");
        }
        List<Organization> orgs = organizationRepository.findAll();
        if (!orgs.isEmpty()) {
            return orgs.get(0);
        }
        throw new UnauthorizedException("Authentication required. No active workspace found.");
    }

    private User resolveCurrentUser(Organization org) {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            return userRepository.findById(userOpt.get().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userOpt.get().getId()));
        }
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }
        throw new UnauthorizedException("Authentication required. No active user found.");
    }
}
