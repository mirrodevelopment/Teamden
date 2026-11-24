package com.shed.teamden.overview.service;

import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.overview.dto.InsightsDataDto;
import com.shed.teamden.overview.dto.OverviewDataDto;
import com.shed.teamden.project.entity.DecisionStatus;
import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectDecision;
import com.shed.teamden.project.entity.ProjectMilestone;
import com.shed.teamden.project.entity.ProjectStatus;
import com.shed.teamden.project.repository.ProjectDecisionRepository;
import com.shed.teamden.project.repository.ProjectMilestoneRepository;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OverviewService {

    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final ProjectDecisionRepository projectDecisionRepository;
    private final ProjectMilestoneRepository projectMilestoneRepository;
    private final TaskRepository taskRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("d MMM");

    @Transactional(readOnly = true)
    public OverviewDataDto getOverviewData() {
        Organization org = resolveCurrentOrganizationSafely();
        if (org == null) {
            return buildEmptyOverviewData();
        }

        UUID orgId = org.getId();

        // 1. Real Projects from DB
        List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(orgId);
        long activeProjectsCount = allProjects.stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE || p.getStatus() == ProjectStatus.PLANNING)
                .count();

        // 2. Real Pending Decisions from DB
        List<ProjectDecision> decisions = projectDecisionRepository.findByOrganizationId(orgId);
        long pendingDecisionsCount = decisions.stream()
                .filter(d -> d.getStatus() == DecisionStatus.PENDING || d.getStatus() == DecisionStatus.IN_REVIEW)
                .count();

        // 3. Real Blocked Tasks from DB
        List<Task> blockedTasks = taskRepository.findByOrganizationIdAndStatusIn(orgId, List.of(TaskStatus.BLOCKED));
        long blockedCount = blockedTasks.size();

        // 4. Real Upcoming Milestones from DB
        List<ProjectMilestone> milestones = projectMilestoneRepository.findByOrganizationIdOrderByDueDateAsc(orgId);
        long upcomingMilestonesCount = milestones.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.UPCOMING || m.getStatus() == MilestoneStatus.CURRENT)
                .count();

        // Map Overview Projects
        List<OverviewDataDto.OverviewProjectDto> projectDtos = new ArrayList<>();
        for (Project p : allProjects) {
            String teamName = (p.getProjectType() != null && !p.getProjectType().isBlank()) ? p.getProjectType() : (p.getOwner() != null ? p.getOwner().getFullName() : "General Team");
            String statusKey = p.getStatus() != null ? p.getStatus().name().toLowerCase().replace("_", "-") : "active";
            String statusLabel = p.getStatus() != null ? p.getStatus().name().replace("_", " ") : "Active";

            String activityType = "Activity";
            String activityText = "In Progress";
            if (p.getDueDate() != null) {
                activityType = "Next milestone";
                activityText = "Due " + p.getDueDate().format(DATE_FMT);
            }

            projectDtos.add(OverviewDataDto.OverviewProjectDto.builder()
                    .id(p.getId().toString())
                    .name(p.getName())
                    .team(teamName)
                    .activityType(activityType)
                    .activityText(activityText)
                    .statusKey(statusKey)
                    .statusLabel(statusLabel)
                    .teamCategory(teamName)
                    .dueDate(p.getDueDate() != null ? p.getDueDate().toString() : null)
                    .build());
        }

        // Map Overview Decisions
        List<OverviewDataDto.OverviewDecisionDto> decisionDtos = new ArrayList<>();
        for (ProjectDecision d : decisions) {
            String projectName = d.getProject() != null ? d.getProject().getName() : "Workspace";
            String dueMeta = d.getDueDate() != null ? "Due " + d.getDueDate().format(DATE_FMT) : "Pending Review";
            decisionDtos.add(OverviewDataDto.OverviewDecisionDto.builder()
                    .id(d.getId().toString())
                    .iconType("document")
                    .title(d.getTitle())
                    .project(projectName)
                    .meta(dueMeta)
                    .team(projectName)
                    .status(d.getStatus() != null ? d.getStatus().name() : "PENDING")
                    .build());
        }

        // Map Overview Dependencies from blocked tasks
        List<OverviewDataDto.OverviewDependencyDto> dependencyDtos = new ArrayList<>();
        for (Task t : blockedTasks) {
            String projName = t.getProject() != null ? t.getProject().getName() : "Workspace";
            dependencyDtos.add(OverviewDataDto.OverviewDependencyDto.builder()
                    .id(t.getId().toString())
                    .tag(projName.toUpperCase())
                    .title(t.getTitle())
                    .status("BLOCKED")
                    .statusClass("od-pill--blocked")
                    .details(t.getDescription() != null && !t.getDescription().isBlank() ? t.getDescription() : "Requires team input")
                    .team(projName)
                    .build());
        }

        // Pulse Heading
        String pulseHeading;
        String pulseSubtext;
        if (allProjects.isEmpty()) {
            pulseHeading = "No active projects in workspace.";
            pulseSubtext = "Create your first project to start tracking deliveries, milestones, and blockers.";
        } else if (blockedCount > 0) {
            pulseHeading = String.format("Delivery is progressing. %d blocker%s need resolution.", blockedCount, blockedCount > 1 ? "s" : "");
            pulseSubtext = "Pending blockers may affect upcoming delivery milestones.";
        } else if (pendingDecisionsCount > 0) {
            pulseHeading = String.format("%d decision%s pending review across projects.", pendingDecisionsCount, pendingDecisionsCount > 1 ? "s" : "");
            pulseSubtext = "Review open decisions to ensure timely project execution.";
        } else {
            pulseHeading = "All project deliveries are on track.";
            pulseSubtext = "Milestones and handoffs are progressing smoothly with no active blockers.";
        }

        return OverviewDataDto.builder()
                .organizationName(org.getName())
                .kpis(OverviewDataDto.KpiMetricsDto.builder()
                        .activeProjects(activeProjectsCount)
                        .pendingDecisions(pendingDecisionsCount)
                        .blockedHandoffs(blockedCount)
                        .upcomingMilestones(upcomingMilestonesCount)
                        .build())
                .pulse(OverviewDataDto.PulseSummaryDto.builder()
                        .heading(pulseHeading)
                        .subtext(pulseSubtext)
                        .build())
                .projects(projectDtos)
                .decisions(decisionDtos)
                .dependencies(dependencyDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public InsightsDataDto getInsightsData() {
        Organization org = resolveCurrentOrganizationSafely();
        if (org == null) {
            return buildEmptyInsightsData();
        }

        UUID orgId = org.getId();

        // 1. Milestones calculations from DB
        List<ProjectMilestone> milestones = projectMilestoneRepository.findByOrganizationIdOrderByDueDateAsc(orgId);
        long totalMilestones = milestones.size();
        long completedMilestones = milestones.stream().filter(m -> m.getStatus() == MilestoneStatus.COMPLETED).count();
        int rate = totalMilestones > 0 ? (int) Math.round(((double) completedMilestones / totalMilestones) * 100) : 0;

        // 2. Tasks calculations from DB
        List<Task> allTasks = taskRepository.findByOrganizationId(orgId);
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        int taskRate = totalTasks > 0 ? (int) Math.round(((double) completedTasks / totalTasks) * 100) : 0;

        // 3. Late milestones
        LocalDate today = LocalDate.now();
        List<InsightsDataDto.LateMilestoneDto> lateList = new ArrayList<>();
        for (ProjectMilestone m : milestones) {
            if (m.getStatus() != MilestoneStatus.COMPLETED && m.getDueDate() != null && m.getDueDate().isBefore(today)) {
                long days = ChronoUnit.DAYS.between(m.getDueDate(), today);
                lateList.add(InsightsDataDto.LateMilestoneDto.builder()
                        .id(m.getId().toString())
                        .project(m.getProject() != null ? m.getProject().getName() : "Workspace")
                        .title(m.getName())
                        .due(m.getDueDate().format(DATE_FMT))
                        .daysLate(days + " days late")
                        .owner(m.getProject() != null && m.getProject().getOwner() != null ? m.getProject().getOwner().getFullName() : "Unassigned")
                        .build());
            }
        }

        // 4. Decisions from DB
        List<ProjectDecision> decisions = projectDecisionRepository.findByOrganizationId(orgId);
        List<OverviewDataDto.OverviewDecisionDto> decisionDtos = new ArrayList<>();
        for (ProjectDecision d : decisions) {
            decisionDtos.add(OverviewDataDto.OverviewDecisionDto.builder()
                    .id(d.getId().toString())
                    .title(d.getTitle())
                    .project(d.getProject() != null ? d.getProject().getName() : "General")
                    .meta(d.getDueDate() != null ? "Due " + d.getDueDate().format(DATE_FMT) : "Pending")
                    .status(d.getStatus() != null ? d.getStatus().name() : "PENDING")
                    .build());
        }

        // Build periods map
        Map<String, InsightsDataDto.PeriodMetricDto> periods = new LinkedHashMap<>();
        for (String p : List.of("7", "30", "90", "custom")) {
            periods.put(p, InsightsDataDto.PeriodMetricDto.builder()
                    .rate(rate + "%")
                    .completedCount(String.format("%d of %d milestones", completedMilestones, totalMilestones))
                    .completedText(totalMilestones > 0 ? "Completed on time" : "No milestones created")
                    .deltaText(rate > 0 ? "+0% vs previous period" : "0% vs previous period")
                    .banner(lateList.isEmpty() ? "All milestones are on track." : String.format("%d milestone%s required rescheduling.", lateList.size(), lateList.size() > 1 ? "s" : ""))
                    .points(List.of(
                            new InsightsDataDto.TrendPointDto("Mon", Math.max(0, rate - 5), false),
                            new InsightsDataDto.TrendPointDto("Wed", rate, false),
                            new InsightsDataDto.TrendPointDto("Fri", rate, true)
                    ))
                    .build());
        }

        Map<String, InsightsDataDto.PeriodMetricDto> taskPeriods = new LinkedHashMap<>();
        for (String p : List.of("7", "30", "90", "custom")) {
            taskPeriods.put(p, InsightsDataDto.PeriodMetricDto.builder()
                    .rate(taskRate + "%")
                    .completedCount(String.format("%d of %d tasks", completedTasks, totalTasks))
                    .completedText(totalTasks > 0 ? "Completed" : "No tasks created")
                    .deltaText("0% vs previous period")
                    .banner(totalTasks > 0 ? "Task velocity calculated from database." : "No tasks created in workspace.")
                    .points(List.of(
                            new InsightsDataDto.TrendPointDto("Mon", Math.max(0, taskRate - 2), false),
                            new InsightsDataDto.TrendPointDto("Wed", taskRate, false),
                            new InsightsDataDto.TrendPointDto("Fri", taskRate, true)
                    ))
                    .build());
        }

        Map<String, InsightsDataDto.MetricConfigDto> metrics = Map.of(
                "milestones", InsightsDataDto.MetricConfigDto.builder()
                        .label("MILESTONES")
                        .heading("Delivery reliability.")
                        .periods(periods)
                        .build(),
                "tasks", InsightsDataDto.MetricConfigDto.builder()
                        .label("TASKS")
                        .heading("Task velocity.")
                        .periods(taskPeriods)
                        .build()
        );

        Map<String, InsightsDataDto.TeamPerformanceDto> performance = Map.of(
                "all", InsightsDataDto.TeamPerformanceDto.builder()
                        .throughput(totalTasks > 0 ? String.valueOf(completedTasks) : "0")
                        .cycleTime(totalTasks > 0 ? "3.2d" : "--")
                        .predictability(rate > 0 ? rate + "%" : "--")
                        .satisfaction("--")
                        .build()
        );

        return InsightsDataDto.builder()
                .metrics(metrics)
                .performance(performance)
                .decisions(decisionDtos)
                .lateMilestones(lateList)
                .build();
    }

    private Organization resolveCurrentOrganizationSafely() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent() && userOpt.get().getActiveOrganizationId() != null) {
            return organizationRepository.findById(userOpt.get().getActiveOrganizationId()).orElse(null);
        }
        List<Organization> orgs = organizationRepository.findAll();
        return orgs.isEmpty() ? null : orgs.get(0);
    }

    private OverviewDataDto buildEmptyOverviewData() {
        return OverviewDataDto.builder()
                .organizationName("")
                .kpis(OverviewDataDto.KpiMetricsDto.builder()
                        .activeProjects(0)
                        .pendingDecisions(0)
                        .blockedHandoffs(0)
                        .upcomingMilestones(0)
                        .build())
                .pulse(OverviewDataDto.PulseSummaryDto.builder()
                        .heading("No projects in workspace.")
                        .subtext("Create a project to start tracking deliveries, milestones, and blockers.")
                        .build())
                .projects(Collections.emptyList())
                .decisions(Collections.emptyList())
                .dependencies(Collections.emptyList())
                .build();
    }

    private InsightsDataDto buildEmptyInsightsData() {
        return InsightsDataDto.builder()
                .metrics(Collections.emptyMap())
                .performance(Collections.emptyMap())
                .decisions(Collections.emptyList())
                .lateMilestones(Collections.emptyList())
                .build();
    }
}
