package com.shed.teamden.dailyupdate.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.dailyupdate.dto.DailyUpdateRequestDto;
import com.shed.teamden.dailyupdate.dto.DailyUpdateResponseDto;
import com.shed.teamden.dailyupdate.dto.DailyUpdateSuggestionDto;
import com.shed.teamden.dailyupdate.entity.DailyUpdate;
import com.shed.teamden.dailyupdate.entity.DailyUpdateMood;
import com.shed.teamden.dailyupdate.entity.DailyUpdateStatus;
import com.shed.teamden.dailyupdate.repository.DailyUpdateRepository;
import com.shed.teamden.dashboard.dto.DailyUpdateSummaryDto;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.KanbanColumn;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyUpdateService {

    private final DailyUpdateRepository dailyUpdateRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ActivityEventRepository activityEventRepository;

    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("EEE, d MMM yyyy");

    @Transactional(readOnly = true)
    public DailyUpdateResponseDto getTodayUpdateForCurrentUser() {
        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);
        LocalDate today = LocalDate.now();

        Optional<DailyUpdate> updateOpt = dailyUpdateRepository
                .findByOrganizationIdAndUserIdAndUpdateDate(org.getId(), user.getId(), today);

        if (updateOpt.isPresent()) {
            return toDto(updateOpt.get());
        }

        // Generate intelligent default suggestions if not posted yet
        DailyUpdateSuggestionDto suggestions = getSuggestionsForToday();
        return DailyUpdateResponseDto.builder()
                .userId(user.getId())
                .authorName(user.getFullName())
                .authorInitials(computeInitials(user.getFullName()))
                .updateDate(today)
                .workCompleted(suggestions.getDefaultCompletedText())
                .workPlanned(suggestions.getDefaultPlannedText())
                .blockers("")
                .status(DailyUpdateStatus.DRAFT)
                .moodTag(DailyUpdateMood.ON_TRACK)
                .formattedDate(today.format(DATE_FMT))
                .submitted(false)
                .build();
    }

    @Transactional
    public DailyUpdateResponseDto saveOrPublishDailyUpdate(DailyUpdateRequestDto request) {
        if (request.getWorkCompleted() == null || request.getWorkCompleted().trim().isEmpty()) {
            throw new BadRequestException("Completed work description cannot be blank");
        }

        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);
        LocalDate today = LocalDate.now();

        Optional<DailyUpdate> existingOpt = dailyUpdateRepository
                .findByOrganizationIdAndUserIdAndUpdateDate(org.getId(), user.getId(), today);

        DailyUpdate update;
        boolean isNew = existingOpt.isEmpty();

        if (isNew) {
            update = DailyUpdate.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .user(user)
                    .updateDate(today)
                    .workCompleted(request.getWorkCompleted().trim())
                    .workPlanned(request.getWorkPlanned() != null ? request.getWorkPlanned().trim() : "")
                    .blockers(request.getBlockers() != null ? request.getBlockers().trim() : "")
                    .status(request.getStatus() != null ? request.getStatus() : DailyUpdateStatus.SUBMITTED)
                    .moodTag(request.getMoodTag() != null ? request.getMoodTag() : DailyUpdateMood.ON_TRACK)
                    .build();
        } else {
            update = existingOpt.get();
            update.setWorkCompleted(request.getWorkCompleted().trim());
            update.setWorkPlanned(request.getWorkPlanned() != null ? request.getWorkPlanned().trim() : "");
            update.setBlockers(request.getBlockers() != null ? request.getBlockers().trim() : "");
            if (request.getStatus() != null) {
                update.setStatus(request.getStatus());
            }
            if (request.getMoodTag() != null) {
                update.setMoodTag(request.getMoodTag());
            }
        }

        DailyUpdate saved = dailyUpdateRepository.save(update);

        // Record ActivityEvent when submitted
        if (saved.getStatus() == DailyUpdateStatus.SUBMITTED) {
            recordDailyUpdateActivityEvent(org, user, saved, today);
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public DailyUpdateSuggestionDto getSuggestionsForToday() {
        Organization org = resolveCurrentOrganization();
        User user = resolveCurrentUser(org);
        LocalDate today = LocalDate.now();

        List<Task> userTasks = taskRepository.findByOrganizationIdAndAssigneeId(org.getId(), user.getId(), PageRequest.of(0, 50));

        // Accomplishments: Completed tasks or tasks updated today
        List<String> completedAccomplishments = userTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .map(t -> "Completed task: " + t.getTitle())
                .limit(5)
                .collect(Collectors.toList());

        if (completedAccomplishments.isEmpty()) {
            completedAccomplishments.add("Advanced active workspace tasks and project deliverables.");
        }

        // Priorities: Tasks in NOW or NEXT columns
        List<String> plannedPriorities = userTasks.stream()
                .filter(t -> t.getStatus() != TaskStatus.COMPLETED)
                .filter(t -> t.getKanbanColumn() == KanbanColumn.NOW || t.getKanbanColumn() == KanbanColumn.NEXT)
                .map(t -> "Focus on: " + t.getTitle())
                .limit(5)
                .collect(Collectors.toList());

        if (plannedPriorities.isEmpty()) {
            plannedPriorities.add("Execute scheduled milestones and coordinate team reviews.");
        }

        String defaultCompletedText = completedAccomplishments.stream()
                .map(s -> "• " + s)
                .collect(Collectors.joining("\n"));

        String defaultPlannedText = plannedPriorities.stream()
                .map(s -> "• " + s)
                .collect(Collectors.joining("\n"));

        return DailyUpdateSuggestionDto.builder()
                .completedAccomplishments(completedAccomplishments)
                .plannedPriorities(plannedPriorities)
                .defaultCompletedText(defaultCompletedText)
                .defaultPlannedText(defaultPlannedText)
                .build();
    }

    @Transactional(readOnly = true)
    public List<DailyUpdateResponseDto> getTeamUpdatesForDate(LocalDate date) {
        Organization org = resolveCurrentOrganization();
        LocalDate targetDate = (date != null) ? date : LocalDate.now();

        return dailyUpdateRepository.findByOrganizationIdAndUpdateDateOrderByCreatedAtDesc(org.getId(), targetDate)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DailyUpdateSummaryDto getDailyUpdateSummary(Organization org, User user, LocalDate date) {
        Optional<DailyUpdate> updateOpt = dailyUpdateRepository
                .findByOrganizationIdAndUserIdAndUpdateDate(org.getId(), user.getId(), date);

        if (updateOpt.isEmpty()) {
            return DailyUpdateSummaryDto.builder()
                    .submitted(false)
                    .status("PENDING")
                    .summaryText("Today's check-in pending")
                    .build();
        }

        DailyUpdate update = updateOpt.get();
        boolean isSubmitted = (update.getStatus() == DailyUpdateStatus.SUBMITTED);
        String timeStr = update.getUpdatedAt() != null
                ? update.getUpdatedAt().atZone(ZoneId.systemDefault()).format(TIME_FMT)
                : update.getCreatedAt().atZone(ZoneId.systemDefault()).format(TIME_FMT);

        return DailyUpdateSummaryDto.builder()
                .submitted(isSubmitted)
                .id(update.getId())
                .status(update.getStatus().name())
                .timeLabel(timeStr)
                .moodTag(update.getMoodTag() != null ? update.getMoodTag().name() : "ON_TRACK")
                .summaryText(isSubmitted ? "Shared today at " + timeStr : "Draft saved at " + timeStr)
                .build();
    }

    private void recordDailyUpdateActivityEvent(Organization org, User user, DailyUpdate update, LocalDate today) {
        String moodLabel = formatMoodLabel(update.getMoodTag());
        String target = "Daily Standup — " + today.format(DATE_FMT);

        ActivityEvent event = ActivityEvent.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .actor(user)
                .eventType(ActivityEventType.DAILY_UPDATE_POSTED)
                .entityType("DAILY_UPDATE")
                .entityId(update.getId())
                .title("published daily update")
                .actionText("published daily update")
                .targetTitle(target)
                .subMeta("Workspace / Standup (" + moodLabel + ")")
                .infoText(truncateText(update.getWorkCompleted(), 200))
                .badgeType("UPDATE")
                .dotColor("green")
                .categoryKey("DAILY_UPDATE")
                .eventTimestamp(Instant.now())
                .build();

        activityEventRepository.save(event);
        log.info("Logged daily update activity event for user {} on {}", user.getEmail(), today);
    }

    private DailyUpdateResponseDto toDto(DailyUpdate update) {
        String formattedDate = update.getUpdateDate() != null ? update.getUpdateDate().format(DATE_FMT) : LocalDate.now().format(DATE_FMT);
        Instant now = Instant.now();
        Instant updated = update.getUpdatedAt() != null ? update.getUpdatedAt() : (update.getCreatedAt() != null ? update.getCreatedAt() : now);
        String timeStr = updated.atZone(ZoneId.systemDefault()).format(TIME_FMT);

        User author = update.getUser();
        String authorName = author != null ? author.getFullName() : "Team Member";

        return DailyUpdateResponseDto.builder()
                .id(update.getId())
                .userId(author != null ? author.getId() : null)
                .authorName(authorName)
                .authorInitials(computeInitials(authorName))
                .updateDate(update.getUpdateDate())
                .workCompleted(update.getWorkCompleted())
                .workPlanned(update.getWorkPlanned())
                .blockers(update.getBlockers())
                .status(update.getStatus())
                .moodTag(update.getMoodTag())
                .createdAt(update.getCreatedAt())
                .updatedAt(update.getUpdatedAt())
                .formattedTime(timeStr)
                .formattedDate(formattedDate)
                .submitted(update.getStatus() == DailyUpdateStatus.SUBMITTED)
                .build();
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent() && userOpt.get().getActiveOrganizationId() != null) {
            return organizationRepository.findById(userOpt.get().getActiveOrganizationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Active organization not found"));
        }
        return organizationRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No organization found in database"));
    }

    private User resolveCurrentUser(Organization org) {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            return userRepository.findById(userOpt.get().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        }
        return userRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No users found in database"));
    }

    private String computeInitials(String name) {
        if (name == null || name.isBlank()) return "TD";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }

    private String formatMoodLabel(DailyUpdateMood mood) {
        if (mood == null) return "On Track";
        switch (mood) {
            case BLOCKED: return "Blocked";
            case NEEDS_REVIEW: return "In Review";
            case HIGH_VELOCITY: return "High Velocity";
            case ON_TRACK:
            default:
                return "On Track";
        }
    }

    private String truncateText(String text, int maxLen) {
        if (text == null) return null;
        if (text.length() <= maxLen) return text;
        return text.substring(0, maxLen - 3) + "...";
    }
}
