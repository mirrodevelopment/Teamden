package com.shed.teamden.inbox.service;

import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.inbox.dto.*;
import com.shed.teamden.inbox.entity.InboxItem;
import com.shed.teamden.inbox.repository.InboxItemRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.repository.ProjectRepository;
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
public class InboxService {

    private final InboxItemRepository inboxItemRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public InboxResponseDto getInbox(String tab, String filter, UUID activeItemId) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        // Fetch user-scoped inbox items directly from PostgreSQL
        List<InboxItem> allUserItems = inboxItemRepository.findUserInboxItems(organization.getId(), currentUser.getId());

        // Calculate genuine database counts (ZERO raw code overrides)
        long allCount = allUserItems.stream().filter(n -> !n.isArchived()).count();
        long needsActionCount = allUserItems.stream()
                .filter(n -> !n.isArchived() && "NEEDS_ACTION".equalsIgnoreCase(n.getCategory()))
                .count();
        long updatesCount = allUserItems.stream()
                .filter(n -> !n.isArchived() && "UPDATES".equalsIgnoreCase(n.getCategory()))
                .count();
        long archivedCount = allUserItems.stream().filter(n -> Boolean.TRUE.equals(n.isArchived())).count();
        long unreadCount = allUserItems.stream()
                .filter(n -> !n.isArchived() && !n.isRead())
                .count();
        long mentionsCount = allUserItems.stream()
                .filter(n -> !n.isArchived() && ("MENTIONS".equalsIgnoreCase(n.getFilterType()) || "MENTION".equalsIgnoreCase(n.getItemType())))
                .count();
        long followingCount = allUserItems.stream()
                .filter(n -> !n.isArchived() && "FOLLOWING".equalsIgnoreCase(n.getFilterType()))
                .count();

        InboxCountsDto counts = InboxCountsDto.builder()
                .all(allCount)
                .needsAction(needsActionCount)
                .updates(updatesCount)
                .archived(archivedCount)
                .unread(unreadCount)
                .mentions(mentionsCount)
                .following(followingCount)
                .build();

        // Filter list based on selected Tab
        List<InboxItem> tabFiltered = allUserItems.stream().filter(n -> {
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
        List<InboxItem> filteredList = tabFiltered.stream().filter(n -> {
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
        List<InboxItemDto> attentionQueue = filteredList.stream()
                .filter(n -> "ATTENTION_QUEUE".equalsIgnoreCase(n.getSection()))
                .map(this::mapToDto)
                .collect(Collectors.toList());

        List<InboxItemDto> updatesToday = filteredList.stream()
                .filter(n -> "REGISTER_TODAY".equalsIgnoreCase(n.getSection()))
                .map(this::mapToDto)
                .collect(Collectors.toList());

        List<InboxItemDto> updatesEarlier = filteredList.stream()
                .filter(n -> "REGISTER_EARLIER".equalsIgnoreCase(n.getSection()))
                .map(this::mapToDto)
                .collect(Collectors.toList());

        // Determine active item for Action in Focus
        InboxItemDto activeItem = null;
        if (activeItemId != null) {
            activeItem = filteredList.stream()
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
        }

        return InboxResponseDto.builder()
                .attentionQueue(attentionQueue)
                .updatesToday(updatesToday)
                .updatesEarlier(updatesEarlier)
                .activeItem(activeItem)
                .counts(counts)
                .build();
    }

    @Transactional
    public InboxItemDto createInboxItem(CreateInboxItemRequestDto req) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        User targetUser = currentUser;
        if (req.getTargetUserId() != null) {
            targetUser = userRepository.findById(req.getTargetUserId()).orElse(currentUser);
        }

        Project project = null;
        if (req.getProjectId() != null) {
            project = projectRepository.findById(req.getProjectId()).orElse(null);
        }

        Instant now = Instant.now();
        InboxItem item = InboxItem.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .user(targetUser)
                .project(project)
                .title(req.getTitle() != null ? req.getTitle().trim() : "Inbox Item")
                .subtitle(req.getSubtitle() != null ? req.getSubtitle().trim() : "")
                .quote(req.getQuote() != null ? req.getQuote().trim() : null)
                .description(req.getDescription() != null ? req.getDescription().trim() : "")
                .category(req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim() : "UPDATES")
                .section(req.getSection() != null && !req.getSection().isBlank() ? req.getSection().trim() : "REGISTER_TODAY")
                .filterType(req.getFilterType() != null && !req.getFilterType().isBlank() ? req.getFilterType().trim() : "ALL")
                .itemType(req.getItemType() != null && !req.getItemType().isBlank() ? req.getItemType().trim() : "UPDATE")
                .projectTitle(req.getProjectTitle() != null ? req.getProjectTitle().trim() : (project != null ? project.getName() : ""))
                .requesterName(req.getRequesterName() != null ? req.getRequesterName().trim() : currentUser.getFullName())
                .requesterInitials(req.getRequesterInitials() != null ? req.getRequesterInitials().trim() : "TD")
                .supportingDocTitle(req.getSupportingDocTitle() != null ? req.getSupportingDocTitle().trim() : "")
                .supportingDocId(req.getSupportingDocId())
                .dueDateStr(req.getDueDateStr() != null ? req.getDueDateStr().trim() : "")
                .actionLabel(req.getActionLabel() != null ? req.getActionLabel().trim() : "View")
                .actionUrl(req.getActionUrl() != null ? req.getActionUrl().trim() : "/pages/inbox/inbox.html")
                .isRead(false)
                .isArchived(false)
                .sortOrder(0)
                .createdAt(now)
                .updatedAt(now)
                .build();

        item = inboxItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public InboxItemDto markAsRead(UUID id) {
        Organization organization = resolveCurrentOrganization();
        InboxItem item = inboxItemRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inbox item not found: " + id));
        item.setRead(true);
        item = inboxItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public void markAllAsRead() {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);
        List<InboxItem> unread = inboxItemRepository.findUnreadUserInboxItems(organization.getId(), currentUser.getId());
        for (InboxItem item : unread) {
            item.setRead(true);
        }
        inboxItemRepository.saveAll(unread);
    }

    @Transactional
    public InboxItemDto toggleArchive(UUID id) {
        Organization organization = resolveCurrentOrganization();
        InboxItem item = inboxItemRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inbox item not found: " + id));
        item.setArchived(!item.isArchived());
        item = inboxItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public InboxItemDto toggleSnooze(UUID id) {
        Organization organization = resolveCurrentOrganization();
        InboxItem item = inboxItemRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inbox item not found: " + id));
        item.setSnoozed(!item.isSnoozed());
        item = inboxItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public InboxItemDto toggleMute(UUID id) {
        Organization organization = resolveCurrentOrganization();
        InboxItem item = inboxItemRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inbox item not found: " + id));
        item.setMuted(!item.isMuted());
        item = inboxItemRepository.save(item);
        return mapToDto(item);
    }

    @Transactional
    public InboxItemDto executeAction(UUID id, String action) {
        Organization organization = resolveCurrentOrganization();
        InboxItem item = inboxItemRepository.findByIdAndOrganizationId(id, organization.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inbox item not found: " + id));
        item.setRead(true);
        if ("APPROVE".equalsIgnoreCase(action) || "ACKNOWLEDGE".equalsIgnoreCase(action)) {
            item.setArchived(true);
        }
        item = inboxItemRepository.save(item);
        return mapToDto(item);
    }

    public InboxItemDto mapToDto(InboxItem n) {
        return InboxItemDto.builder()
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
                .projectId(n.getProject() != null ? n.getProject().getId() : null)
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
        throw new UnauthorizedException("Authentication required: No organization found");
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
        throw new UnauthorizedException("Authentication required: No user found");
    }
}
