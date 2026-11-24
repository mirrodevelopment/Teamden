package com.shed.teamden.project.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.entity.ActivityEventType;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.project.dto.CreateMilestoneRequestDto;
import com.shed.teamden.project.dto.ProjectMilestoneDto;
import com.shed.teamden.project.dto.UpdateMilestoneRequestDto;
import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectMilestone;
import com.shed.teamden.project.repository.ProjectMilestoneRepository;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectMilestoneService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("MMM dd, yyyy");
    private static final String BADGE_DOCUMENT = "DOCUMENT";
    private static final String STATUS_UPCOMING = "UPCOMING";

    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final ActivityEventRepository activityEventRepository;

    @Transactional(readOnly = true)
    public List<ProjectMilestoneDto> getProjectMilestones(UUID projectId) {
        Organization organization = resolveCurrentOrganization();
        Project project = resolveProject(organization, projectId);

        List<ProjectMilestone> milestones = projectMilestoneRepository
                .findByOrganizationIdAndProjectIdOrderBySeqNumAsc(organization.getId(), project.getId());
        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());

        return milestones.stream()
                .map(m -> toDto(m, tasks))
                .toList();
    }

    @Transactional
    public ProjectMilestoneDto createMilestone(UUID projectId, CreateMilestoneRequestDto req) {
        validateCreateMilestoneRequest(req);

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();
        Project project = resolveProject(organization, projectId);

        int seqNum = determineSeqNum(organization.getId(), project.getId(), req.getSeqNum());
        MilestoneStatus status = parseMilestoneStatus(req.getStatus(), MilestoneStatus.UPCOMING);
        LocalDate due = parseDueDate(req.getDueDate());
        String code = String.format("%02d", seqNum);

        String statusLabel = req.getStatusLabel() != null && !req.getStatusLabel().isBlank()
                ? req.getStatusLabel().trim()
                : resolveDefaultStatusLabel(status);

        ProjectMilestone milestone = ProjectMilestone.builder()
                .id(UUID.randomUUID())
                .organization(organization)
                .project(project)
                .seqNum(seqNum)
                .code(code)
                .name(req.getName().trim())
                .description(req.getDescription() != null ? req.getDescription().trim() : "")
                .status(status)
                .statusLabel(statusLabel)
                .dueDate(due)
                .completedAt(status == MilestoneStatus.COMPLETED ? Instant.now() : null)
                .build();

        milestone = projectMilestoneRepository.save(milestone);

        // Record Activity Event
        recordActivity(organization, currentUser, project, "added milestone", milestone.getName(), BADGE_DOCUMENT, "green");

        return toDto(milestone, Collections.emptyList());
    }

    private void validateCreateMilestoneRequest(CreateMilestoneRequestDto req) {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new BadRequestException("Milestone name is required");
        }
    }

    private int determineSeqNum(UUID orgId, UUID projectId, Integer requestedSeqNum) {
        if (requestedSeqNum != null && requestedSeqNum > 0) {
            return requestedSeqNum;
        }
        List<ProjectMilestone> existing = projectMilestoneRepository
                .findByOrganizationIdAndProjectIdOrderBySeqNumAsc(orgId, projectId);
        if (!existing.isEmpty()) {
            return existing.get(existing.size() - 1).getSeqNum() + 1;
        }
        return 1;
    }

    private MilestoneStatus parseMilestoneStatus(String rawStatus, MilestoneStatus fallback) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return fallback;
        }
        try {
            return MilestoneStatus.valueOf(rawStatus.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            // Fall back to default on invalid status format
            return fallback;
        }
    }

    private LocalDate parseDueDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(rawDate.trim());
        } catch (DateTimeParseException e) {
            // Fall back to null on unparseable date format
            return null;
        }
    }

    private String resolveDefaultStatusLabel(MilestoneStatus status) {
        if (status == MilestoneStatus.CURRENT) {
            return "In Progress";
        }
        if (status == MilestoneStatus.COMPLETED) {
            return "Completed";
        }
        return "Upcoming";
    }

    @Transactional
    public ProjectMilestoneDto updateMilestone(UUID projectId, UUID milestoneId, UpdateMilestoneRequestDto req) {
        if (milestoneId == null) {
            throw new BadRequestException("Milestone ID is required");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();
        Project project = resolveProject(organization, projectId);

        ProjectMilestone milestone = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));

        if (!milestone.getOrganization().getId().equals(organization.getId())
                || !milestone.getProject().getId().equals(project.getId())) {
            throw new BadRequestException("Milestone does not belong to this project or organization");
        }

        applyMilestoneUpdates(milestone, req);

        milestone = projectMilestoneRepository.save(milestone);

        // Record Activity Event
        recordActivity(organization, currentUser, project, "updated milestone", milestone.getName(), BADGE_DOCUMENT, "blue");

        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
        return toDto(milestone, tasks);
    }

    private void applyMilestoneUpdates(ProjectMilestone milestone, UpdateMilestoneRequestDto req) {
        if (req.getName() != null && !req.getName().isBlank()) {
            milestone.setName(req.getName().trim());
        }

        if (req.getSeqNum() != null && req.getSeqNum() > 0) {
            milestone.setSeqNum(req.getSeqNum());
            milestone.setCode(String.format("%02d", req.getSeqNum()));
        }

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            MilestoneStatus newStatus = parseMilestoneStatus(req.getStatus(), null);
            if (newStatus != null) {
                if (newStatus == MilestoneStatus.COMPLETED && milestone.getStatus() != MilestoneStatus.COMPLETED) {
                    milestone.setCompletedAt(Instant.now());
                } else if (newStatus != MilestoneStatus.COMPLETED) {
                    milestone.setCompletedAt(null);
                }
                milestone.setStatus(newStatus);
            }
        }

        if (req.getStatusLabel() != null && !req.getStatusLabel().isBlank()) {
            milestone.setStatusLabel(req.getStatusLabel().trim());
        } else if (milestone.getStatus() != null) {
            milestone.setStatusLabel(resolveDefaultStatusLabel(milestone.getStatus()));
        }

        if (req.getDueDate() != null) {
            milestone.setDueDate(parseDueDate(req.getDueDate()));
        }

        if (req.getDescription() != null) {
            milestone.setDescription(req.getDescription().trim());
        }
    }

    @Transactional
    public void deleteMilestone(UUID projectId, UUID milestoneId) {
        if (milestoneId == null) {
            throw new BadRequestException("Milestone ID is required");
        }

        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();
        Project project = resolveProject(organization, projectId);

        ProjectMilestone milestone = projectMilestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found"));

        if (!milestone.getOrganization().getId().equals(organization.getId())
                || !milestone.getProject().getId().equals(project.getId())) {
            throw new BadRequestException("Milestone does not belong to this project or organization");
        }

        String milestoneName = milestone.getName();

        // Disassociate any tasks linked to this milestone
        List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
        for (Task t : tasks) {
            if (t.getMilestone() != null && t.getMilestone().getId().equals(milestoneId)) {
                t.setMilestone(null);
                taskRepository.save(t);
            }
        }

        projectMilestoneRepository.delete(milestone);

        // Record Activity Event
        recordActivity(organization, currentUser, project, "removed milestone", milestoneName, BADGE_DOCUMENT, "red");
    }

    @Transactional
    public List<ProjectMilestoneDto> initializeLifecycleTemplate(UUID projectId) {
        Organization organization = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();
        Project project = resolveProject(organization, projectId);

        List<ProjectMilestone> existing = projectMilestoneRepository
                .findByOrganizationIdAndProjectIdOrderBySeqNumAsc(organization.getId(), project.getId());
        if (!existing.isEmpty()) {
            List<Task> tasks = taskRepository.findByProjectIdWithDetails(project.getId());
            return existing.stream().map(m -> toDto(m, tasks)).toList();
        }

        // Standard 9-Stage Canonical Editorial Lifecycle
        List<String[]> templateStages = List.of(
                new String[]{"Discovery", "Initial scoping and requirements discovery", "COMPLETED"},
                new String[]{"Design", "Design system, wireframes, and high-fidelity mockups", "COMPLETED"},
                new String[]{"Development", "Full-stack feature engineering and implementation", "COMPLETED"},
                new String[]{"Testing", "Quality assurance, unit testing, and cross-browser audits", "COMPLETED"},
                new String[]{"Content", "Copywriting, asset curation, and SEO metadata", "COMPLETED"},
                new String[]{"Review", "Stakeholder review and feedback incorporation", "CURRENT"},
                new String[]{"Launch Prep", "Staging verification, rollback plans, and checklist", STATUS_UPCOMING},
                new String[]{"Go Live", "Production deployment and public launch", STATUS_UPCOMING},
                new String[]{"Post Launch", "Post-deployment monitoring and metrics validation", STATUS_UPCOMING}
        );

        List<ProjectMilestone> savedMilestones = new ArrayList<>();
        LocalDate baseDue = project.getStartDate() != null ? project.getStartDate() : LocalDate.now(ZoneId.systemDefault());

        int seq = 1;
        for (String[] stage : templateStages) {
            String name = stage[0];
            String desc = stage[1];
            MilestoneStatus st = MilestoneStatus.valueOf(stage[2]);
            String stLabel = resolveDefaultStatusLabel(st);

            ProjectMilestone m = ProjectMilestone.builder()
                    .id(UUID.randomUUID())
                    .organization(organization)
                    .project(project)
                    .seqNum(seq)
                    .code(String.format("%02d", seq))
                    .name(name)
                    .description(desc)
                    .status(st)
                    .statusLabel(stLabel)
                    .dueDate(baseDue.plusDays(seq * 7L))
                    .completedAt(st == MilestoneStatus.COMPLETED ? Instant.now() : null)
                    .build();
            seq++;
            savedMilestones.add(projectMilestoneRepository.save(m));
        }

        recordActivity(organization, currentUser, project, "initialized 9-stage lifecycle for", project.getName(), BADGE_DOCUMENT, "green");

        return savedMilestones.stream()
                .map(m -> toDto(m, Collections.emptyList()))
                .toList();
    }

    private ProjectMilestoneDto toDto(ProjectMilestone m, List<Task> tasks) {
        long count = tasks.stream()
                .filter(t -> t.getMilestone() != null && t.getMilestone().getId().equals(m.getId()))
                .count();

        String dueFmt = m.getDueDate() != null ? m.getDueDate().format(DATE_FMT) : "No due date";

        return ProjectMilestoneDto.builder()
                .id(m.getId())
                .seqNum(m.getSeqNum())
                .code(m.getCode())
                .name(m.getName())
                .description(m.getDescription() != null ? m.getDescription() : "")
                .status(m.getStatus() != null ? m.getStatus().name() : STATUS_UPCOMING)
                .statusLabel(m.getStatusLabel() != null ? m.getStatusLabel() : "")
                .dueDate(m.getDueDate())
                .dueDateFormatted(dueFmt)
                .completedAt(m.getCompletedAt())
                .tasksCount(count)
                .build();
    }

    private void recordActivity(Organization org, User user, Project proj, String action, String target, String badge, String dot) {
        try {
            ActivityEvent event = ActivityEvent.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .actor(user)
                    .eventType(ActivityEventType.PROJECT_UPDATED)
                    .entityType("PROJECT")
                    .entityId(proj.getId())
                    .project(proj)
                    .title(action + " " + target)
                    .description(action + " " + target)
                    .actionText(action)
                    .targetTitle(target)
                    .subMeta(proj.getName() + " / Milestones")
                    .badgeType(badge)
                    .dotColor(dot)
                    .eventTimestamp(Instant.now())
                    .build();
            activityEventRepository.save(event);
        } catch (Exception e) {
            log.warn("Could not log activity event for milestone mutation: {}", e.getMessage());
        }
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

    private User resolveCurrentUser() {
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

    private Project resolveProject(Organization org, UUID projectId) {
        if (projectId == null) {
            throw new BadRequestException("Project ID is required");
        }
        return projectRepository.findByOrganizationIdAndId(org.getId(), projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found in this organization: " + projectId));
    }
}
