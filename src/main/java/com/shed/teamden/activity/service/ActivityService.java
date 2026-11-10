package com.shed.teamden.activity.service;

import com.shed.teamden.activity.dto.ActivityPageDataDto;
import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.dashboard.dto.ActivityItemDto;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@SuppressWarnings("unused")
@Service
@Slf4j
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityEventRepository activityEventRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm")
            .withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter DATE_LABEL_FMT = DateTimeFormatter.ofPattern("d MMM")
            .withZone(ZoneId.systemDefault());

    @Transactional
    public ActivityEvent recordEvent(
            Organization organization,
            User actor,
            ActivityEventType eventType,
            String entityType,
            UUID entityId,
            String title,
            String description) {
        return recordEvent(
                organization,
                actor,
                eventType,
                entityType,
                entityId,
                title,
                description,
                null,
                null,
                null,
                null,
                null,
                null,
                null);
    }

    @Transactional
    public ActivityEvent recordEvent(
            Organization organization,
            User actor,
            ActivityEventType eventType,
            String entityType,
            UUID entityId,
            String title,
            String description,
            String actionText,
            String targetTitle,
            String subMeta,
            String infoText,
            String quotePreview,
            String badgeType,
            String dotColor) {
        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .actor(actor)
                .eventType(eventType)
                .entityType(entityType)
                .entityId(entityId)
                .title(title)
                .description(description)
                .actionText(actionText)
                .targetTitle(targetTitle)
                .subMeta(subMeta)
                .infoText(infoText)
                .quotePreview(quotePreview)
                .badgeType(badgeType)
                .dotColor(dotColor)
                .eventTimestamp(Instant.now())
                .build();

        log.debug("Recording activity event: {} for org: {}", eventType, organization.getId());
        return activityEventRepository.save(event);
    }

    @Transactional
    public ActivityPageDataDto getActivityPageData(String range, LocalDate startDate, LocalDate endDate, String type,
            String query) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser(organization);

        String rangeNorm = (range != null && !range.isBlank()) ? range.trim().toLowerCase() : "all";
        LocalDate today = LocalDate.now();

        Instant start = null;
        Instant end = null;

        if ("today".equals(rangeNorm)) {
            start = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else if ("yesterday".equals(rangeNorm)) {
            LocalDate yesterday = today.minusDays(1);
            start = yesterday.atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else if ("last_week".equals(rangeNorm)) {
            start = today.minusDays(7).atStartOfDay(ZoneId.systemDefault()).toInstant();
            end = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        } else if ("custom".equals(rangeNorm)) {
            if (startDate != null) {
                start = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
            }
            if (endDate != null) {
                end = endDate.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
            }
        }

        List<ActivityEvent> events;
        if (start != null && end != null) {
            events = activityEventRepository.findFilteredByOrganizationId(organization.getId(), start, end);
        } else if (start != null) {
            events = activityEventRepository.findFilteredByOrganizationId(organization.getId(), start,
                    Instant.now().plusSeconds(86400));
        } else if (end != null) {
            events = activityEventRepository.findFilteredByOrganizationId(organization.getId(), Instant.EPOCH, end);
        } else {
            events = activityEventRepository.findAllByOrganizationIdWithDetails(organization.getId());
        }

        // Apply type filter if provided
        if (type != null && !type.isBlank() && !"all".equalsIgnoreCase(type.trim())) {
            String typeNorm = type.trim().toUpperCase();
            events = events.stream().filter(e -> matchesTypeFilter(e, typeNorm)).toList();
        }

        // Apply text query if provided
        if (query != null && !query.isBlank()) {
            String q = query.trim().toLowerCase();
            events = events.stream().filter(e -> matchesTextQuery(e, q)).toList();
        }

        List<ActivityItemDto> items = new ArrayList<>();
        int completedCount = 0;
        int documentCount = 0;
        int assignedCount = 0;
        int commentCount = 0;

        for (ActivityEvent event : events) {
            ActivityItemDto dto = toActivityItemDto(event, today);
            items.add(dto);

            String badge = dto.getBadgeType();
            if ("COMPLETED".equalsIgnoreCase(badge))
                completedCount++;
            else if ("DOCUMENT".equalsIgnoreCase(badge))
                documentCount++;
            else if ("ASSIGNED".equalsIgnoreCase(badge))
                assignedCount++;
            else if ("COMMENT".equalsIgnoreCase(badge))
                commentCount++;
        }

        DateTimeFormatter breadcrumbFmt = DateTimeFormatter.ofPattern("EEE, d MMM yyyy");
        String formattedDate = today.format(breadcrumbFmt);

        return ActivityPageDataDto.builder()
                .workspaceBreadcrumb("YOUR WORKSPACE / MOVEMENTS / AUDIT LOG")
                .currentDateLabel("LATEST MOVEMENTS / " + formattedDate.toUpperCase())
                .totalCount(items.size())
                .completedCount(completedCount)
                .documentCount(documentCount)
                .assignedCount(assignedCount)
                .commentCount(commentCount)
                .selectedRange(rangeNorm)
                .activities(items)
                .build();
    }

    @Transactional(readOnly = true)
    public ActivityItemDto getActivityById(String id) {
        if (id == null || id.isBlank()) {
            throw new BadRequestException("Activity ID is required");
        }
        UUID uuid;
        try {
            uuid = UUID.fromString(id.trim().replace("act-", ""));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid activity ID format: " + id);
        }

        Organization organization = resolveCurrentOrganization();
        ActivityEvent event = activityEventRepository.findById(uuid)
                .orElseThrow(() -> new ResourceNotFoundException("Activity event not found: " + id));

        if (!event.getOrganization().getId().equals(organization.getId())) {
            throw new BadRequestException("Activity event does not belong to the active organization");
        }

        return toActivityItemDto(event, LocalDate.now());
    }

    private boolean matchesTypeFilter(ActivityEvent event, String filterType) {
        if (event.getBadgeType() != null && !event.getBadgeType().isBlank()) {
            return event.getBadgeType().equalsIgnoreCase(filterType);
        }
        if ("COMPLETED".equals(filterType)) {
            return event.getEventType() == ActivityEventType.TASK_COMPLETED
                    || event.getEventType() == ActivityEventType.ATTENDANCE_CHECKIN;
        } else if ("DOCUMENT".equals(filterType)) {
            return event.getEventType() == ActivityEventType.PROJECT_UPDATED
                    || event.getEventType() == ActivityEventType.PROJECT_CREATED;
        } else if ("ASSIGNED".equals(filterType)) {
            return event.getEventType() == ActivityEventType.TASK_ASSIGNED;
        } else if ("COMMENT".equals(filterType)) {
            return event.getEventType() == ActivityEventType.TASK_CREATED
                    || event.getEventType() == ActivityEventType.TASK_STATUS_CHANGED;
        }
        return true;
    }

    private boolean matchesTextQuery(ActivityEvent event, String q) {
        if (event.getTitle() != null && event.getTitle().toLowerCase().contains(q))
            return true;
        if (event.getDescription() != null && event.getDescription().toLowerCase().contains(q))
            return true;
        if (event.getTargetTitle() != null && event.getTargetTitle().toLowerCase().contains(q))
            return true;
        if (event.getActionText() != null && event.getActionText().toLowerCase().contains(q))
            return true;
        if (event.getSubMeta() != null && event.getSubMeta().toLowerCase().contains(q))
            return true;
        if (event.getInfoText() != null && event.getInfoText().toLowerCase().contains(q))
            return true;
        if (event.getQuotePreview() != null && event.getQuotePreview().toLowerCase().contains(q))
            return true;
        if (event.getBadgeType() != null && event.getBadgeType().toLowerCase().contains(q))
            return true;
        if (event.getActor() != null && event.getActor().getFullName() != null
                && event.getActor().getFullName().toLowerCase().contains(q))
            return true;
        if (event.getProject() != null && event.getProject().getName() != null
                && event.getProject().getName().toLowerCase().contains(q))
            return true;
        return false;
    }

    private ActivityItemDto toActivityItemDto(ActivityEvent event, LocalDate today) {
        Instant ts = event.getEventTimestamp() != null ? event.getEventTimestamp() : Instant.now();
        LocalDate eventDate = ts.atZone(ZoneId.systemDefault()).toLocalDate();

        String dayLabel;
        if (eventDate.equals(today)) {
            dayLabel = "TODAY";
        } else if (eventDate.equals(today.minusDays(1))) {
            dayLabel = "YESTERDAY";
        } else {
            dayLabel = DATE_LABEL_FMT.format(ts).toUpperCase();
        }

        String author = event.getActor() != null ? event.getActor().getFullName() : "System";
        String dot = event.getDotColor();
        String badge = event.getBadgeType();
        String actionText = event.getActionText();
        String targetTitle = event.getTargetTitle();
        String subMeta = event.getSubMeta();
        String infoText = event.getInfoText();
        String quotePreview = event.getQuotePreview();

        if (dot == null || dot.isBlank())
            dot = "purple";
        if (badge == null || badge.isBlank())
            badge = event.getEventType() != null ? event.getEventType().name() : "ACTIVITY";
        if (actionText == null || actionText.isBlank())
            actionText = event.getTitle() != null ? event.getTitle() : "updated";
        if (targetTitle == null || targetTitle.isBlank())
            targetTitle = event.getDescription() != null ? event.getDescription() : "Activity item";
        if (subMeta == null || subMeta.isBlank()) {
            subMeta = event.getProject() != null ? event.getProject().getName() + " / Team" : "Workspace / General";
        }

        return ActivityItemDto.builder()
                .id(event.getId().toString())
                .time(TIME_FMT.format(ts))
                .dayLabel(dayLabel)
                .dotColor(dot)
                .badgeType(badge)
                .author(author)
                .actionText(actionText)
                .targetTitle(targetTitle)
                .subMeta(subMeta)
                .quotePreview(quotePreview)
                .infoText(infoText)
                .build();
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            if (userOpt.get().getActiveOrganizationId() != null) {
                return organizationRepository.findById(userOpt.get().getActiveOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Active organization not found: " + userOpt.get().getActiveOrganizationId()));
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
        User defaultUser = User.builder()
                .id(UUID.randomUUID())
                .fullName("SIVASURYA S")
                .email("admin@brick.local")
                .passwordHash("$2a$12$e0MYzXy/vP7J11.d3Jg1y.X9vG32g9J8qX8f0gK6hP2cQ3v5gK7a")
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(defaultUser);
    }
}
