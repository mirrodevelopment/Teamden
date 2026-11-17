package com.shed.teamden.notification.service;

import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.notification.dto.NotificationCountsDto;
import com.shed.teamden.notification.dto.NotificationDto;
import com.shed.teamden.notification.dto.NotificationResponseDto;
import com.shed.teamden.notification.entity.Notification;
import com.shed.teamden.notification.repository.NotificationRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
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
        ensureSeedData(organization);

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
        long archivedCount = allOrgNotifications.stream().filter(Notification::isArchived).count();
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

    private void ensureSeedData(Organization organization) {
        if (notificationRepository.countByOrganizationId(organization.getId()) > 0) {
            return;
        }

        Instant now = Instant.now();
        List<Notification> seeds = List.of(
                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("ATTENTION_QUEUE")
                        .category("NEEDS_ACTION")
                        .filterType("ALL")
                        .itemType("APPROVAL")
                        .title("Brand identity approval")
                        .subtitle("Brand Development · Your decision required")
                        .description("Your approval is required before the client presentation.")
                        .projectTitle("Brand Development")
                        .requesterName("Peter K.")
                        .requesterInitials("PK")
                        .supportingDocTitle("Brand Identity Guidelines")
                        .dueDateStr("Due 30 Oct")
                        .actionLabel("Review decision")
                        .actionUrl("/pages/projects/projects.html")
                        .isRead(false)
                        .isArchived(false)
                        .sortOrder(1)
                        .createdAt(now.minus(45, ChronoUnit.MINUTES))
                        .updatedAt(now.minus(45, ChronoUnit.MINUTES))
                        .build(),

                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("ATTENTION_QUEUE")
                        .category("NEEDS_ACTION")
                        .filterType("ALL")
                        .itemType("FEEDBACK")
                        .title("Review mobile navigation")
                        .subtitle("Website Redesign · Feedback requested")
                        .description("Please review the proposed mobile navigation transitions and hamburger interaction hierarchy before code freeze.")
                        .projectTitle("Website Redesign")
                        .requesterName("Alex R.")
                        .requesterInitials("AR")
                        .supportingDocTitle("Design Review Notes")
                        .dueDateStr("Due 31 Oct")
                        .actionLabel("Submit feedback")
                        .actionUrl("/pages/discovery/discovery.html?q=mobile+navigation")
                        .isRead(false)
                        .isArchived(false)
                        .sortOrder(2)
                        .createdAt(now.minus(2, ChronoUnit.HOURS))
                        .updatedAt(now.minus(2, ChronoUnit.HOURS))
                        .build(),

                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("ATTENTION_QUEUE")
                        .category("NEEDS_ACTION")
                        .filterType("ALL")
                        .itemType("HANDOFF")
                        .title("Design handoff acknowledgement")
                        .subtitle("Design → Engineering · Response required")
                        .description("Sprint 44 design deliverables exported to Zeplin and Figma. Engineering lead acknowledgement requested.")
                        .projectTitle("Client Application")
                        .requesterName("Marcus V.")
                        .requesterInitials("MV")
                        .supportingDocTitle("Engineering Handoff V2")
                        .dueDateStr("Due 02 Nov")
                        .actionLabel("Acknowledge handoff")
                        .actionUrl("/pages/projects/projects.html")
                        .isRead(false)
                        .isArchived(false)
                        .sortOrder(3)
                        .createdAt(now.minus(4, ChronoUnit.HOURS))
                        .updatedAt(now.minus(4, ChronoUnit.HOURS))
                        .build(),

                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("REGISTER_TODAY")
                        .category("UPDATES")
                        .filterType("MENTIONS")
                        .itemType("MENTION")
                        .title("Alex R. mentioned you")
                        .subtitle("Design Review Notes · 12 minutes ago")
                        .quote("\"Can we finalise the navigation direction?\"")
                        .description("Alex R. commented on Design Review Notes: \"Can we finalise the navigation direction? Need your sign-off before today's standup.\"")
                        .projectTitle("Website Redesign")
                        .requesterName("Alex R.")
                        .requesterInitials("AR")
                        .supportingDocTitle("Design Review Notes")
                        .dueDateStr("Today")
                        .actionLabel("Reply in thread")
                        .actionUrl("/pages/discovery/discovery.html?q=navigation")
                        .isRead(false)
                        .isArchived(false)
                        .sortOrder(4)
                        .createdAt(now.minus(12, ChronoUnit.MINUTES))
                        .updatedAt(now.minus(12, ChronoUnit.MINUTES))
                        .build(),

                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("REGISTER_TODAY")
                        .category("UPDATES")
                        .filterType("FOLLOWING")
                        .itemType("ASSIGNMENT")
                        .title("You were assigned a new task")
                        .subtitle("Update design components · Client Application · 1 hour ago")
                        .quote(null)
                        .description("You have been assigned to task T-018: Update design components for responsive layouts.")
                        .projectTitle("Client Application")
                        .requesterName("Marcus V.")
                        .requesterInitials("MV")
                        .supportingDocTitle("Design System Tokens")
                        .dueDateStr("Due 04 Nov")
                        .actionLabel("Open task")
                        .actionUrl("/pages/dashboard/dashboard.html")
                        .isRead(false)
                        .isArchived(false)
                        .sortOrder(5)
                        .createdAt(now.minus(60, ChronoUnit.MINUTES))
                        .updatedAt(now.minus(60, ChronoUnit.MINUTES))
                        .build(),

                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("REGISTER_TODAY")
                        .category("UPDATES")
                        .filterType("ALL")
                        .itemType("DECISION")
                        .title("Design specifications approved")
                        .subtitle("Website Redesign · Engineering handoff · 3 hours ago")
                        .quote(null)
                        .description("Elena T. has approved the design specifications for Website Redesign sprint milestone.")
                        .projectTitle("Website Redesign")
                        .requesterName("Elena T.")
                        .requesterInitials("ET")
                        .supportingDocTitle("Specifications V1.4")
                        .dueDateStr("3 hours ago")
                        .actionLabel("View milestone")
                        .actionUrl("/pages/projects/projects.html")
                        .isRead(false)
                        .isArchived(false)
                        .sortOrder(6)
                        .createdAt(now.minus(180, ChronoUnit.MINUTES))
                        .updatedAt(now.minus(180, ChronoUnit.MINUTES))
                        .build(),

                Notification.builder()
                        .id(UUID.randomUUID())
                        .organization(organization)
                        .section("REGISTER_EARLIER")
                        .category("UPDATES")
                        .filterType("ALL")
                        .itemType("CALENDAR")
                        .title("Client review rescheduled")
                        .subtitle("Brand Development · Calendar update · Yesterday")
                        .quote(null)
                        .description("The quarterly client review has been moved from Thursday to Friday 10:00 AM.")
                        .projectTitle("Brand Development")
                        .requesterName("Peter K.")
                        .requesterInitials("PK")
                        .supportingDocTitle("Client Presentation Deck")
                        .dueDateStr("Yesterday")
                        .actionLabel("Open calendar")
                        .actionUrl("/pages/calendar/calendar.html")
                        .isRead(true)
                        .isArchived(false)
                        .sortOrder(7)
                        .createdAt(now.minus(24, ChronoUnit.HOURS))
                        .updatedAt(now.minus(24, ChronoUnit.HOURS))
                        .build()
        );

        notificationRepository.saveAll(seeds);
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
        Organization defaultOrg = Organization.builder()
                .id(UUID.randomUUID())
                .name("Acme Co.")
                .status(OrganizationStatus.ACTIVE)
                .build();
        return organizationRepository.save(defaultOrg);
    }
}
