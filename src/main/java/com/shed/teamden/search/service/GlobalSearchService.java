package com.shed.teamden.search.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.search.dto.GlobalSearchResponseDto;
import com.shed.teamden.search.dto.GlobalSearchResultDto;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlobalSearchService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ActivityEventRepository activityEventRepository;
    private final OrganizationMembershipRepository orgMembershipRepository;

    @Transactional(readOnly = true)
    public GlobalSearchResponseDto search(UUID orgId, String query, String category, int limit) {
        String q = (query == null) ? "" : query.trim().toLowerCase();

        List<GlobalSearchResultDto> tasks = new ArrayList<>();
        List<GlobalSearchResultDto> projects = new ArrayList<>();
        List<GlobalSearchResultDto> people = new ArrayList<>();
        List<GlobalSearchResultDto> activity = new ArrayList<>();

        // Search tasks
        if (category.equals("ALL") || category.equals("TASKS")) {
            List<Task> allTasks = taskRepository.findByOrganizationId(orgId);
            tasks = allTasks.stream()
                .filter(t -> q.isEmpty() || t.getTitle().toLowerCase().contains(q)
                    || (t.getDescription() != null && t.getDescription().toLowerCase().contains(q))
                    || (t.getTaskCode() != null && t.getTaskCode().toLowerCase().contains(q)))
                .limit(limit)
                .map(t -> GlobalSearchResultDto.builder()
                    .id(t.getId())
                    .type("TASK")
                    .title(t.getTitle())
                    .subtitle(t.getProject() != null ? t.getProject().getName() : "No Project")
                    .meta(t.getAssignee() != null ? t.getAssignee().getFullName() : "Unassigned")
                    .status(t.getStatus() != null ? t.getStatus().name() : "TODO")
                    .url("/pages/tasks/create.html?taskId=" + t.getId())
                    .iconType("task")
                    .taskCode(t.getTaskCode())
                    .build())
                .collect(Collectors.toList());
        }

        // Search projects
        if (category.equals("ALL") || category.equals("PROJECTS")) {
            List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(orgId);
            projects = allProjects.stream()
                .filter(p -> q.isEmpty() || p.getName().toLowerCase().contains(q)
                    || (p.getDescription() != null && p.getDescription().toLowerCase().contains(q)))
                .limit(limit)
                .map(p -> GlobalSearchResultDto.builder()
                    .id(p.getId())
                    .type("PROJECT")
                    .title(p.getName())
                    .subtitle(p.getProjectType() != null ? p.getProjectType() : "Project")
                    .meta(p.getOwner() != null ? p.getOwner().getFullName() : "No Owner")
                    .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                    .url("/pages/projects/project-detail/project-detail.html?projectId=" + p.getId())
                    .iconType("project")
                    .build())
                .collect(Collectors.toList());
        }

        // Search people (org members)
        if (category.equals("ALL") || category.equals("PEOPLE")) {
            List<OrganizationMembership> members = orgMembershipRepository.findByOrganizationIdAndStatusWithUser(orgId, MembershipStatus.ACTIVE);
            people = members.stream()
                .filter(m -> m.getUser() != null && (q.isEmpty()
                    || m.getUser().getFullName().toLowerCase().contains(q)
                    || m.getUser().getEmail().toLowerCase().contains(q)))
                .limit(limit)
                .map(m -> GlobalSearchResultDto.builder()
                    .id(m.getUser().getId())
                    .type("PERSON")
                    .title(m.getUser().getFullName())
                    .subtitle(m.getRole() != null ? m.getRole().name() : "Member")
                    .meta(m.getUser().getEmail())
                    .status("ACTIVE")
                    .url("/pages/team/team-detail/team-detail.html")
                    .iconType("person")
                    .build())
                .collect(Collectors.toList());
        }

        // Search activity
        if (category.equals("ALL") || category.equals("DOCUMENTS")) {
            List<ActivityEvent> events = activityEventRepository.findAllByOrganizationIdWithDetails(orgId);
            activity = events.stream()
                .filter(e -> q.isEmpty()
                    || (e.getTitle() != null && e.getTitle().toLowerCase().contains(q))
                    || (e.getTargetTitle() != null && e.getTargetTitle().toLowerCase().contains(q)))
                .limit(limit)
                .map(e -> GlobalSearchResultDto.builder()
                    .id(e.getId())
                    .type("DOCUMENT")
                    .title(e.getTargetTitle() != null ? e.getTargetTitle() : e.getTitle())
                    .subtitle(e.getProject() != null ? e.getProject().getName() : "General")
                    .meta(e.getActor() != null ? e.getActor().getFullName() : "System")
                    .status("ACTIVE")
                    .url("/pages/activity/activity.html")
                    .iconType("document")
                    .build())
                .distinct()
                .collect(Collectors.toList());
        }

        // Merge results
        List<GlobalSearchResultDto> all = new ArrayList<>();
        all.addAll(tasks);
        all.addAll(projects);
        all.addAll(people);
        all.addAll(activity);

        // Counts
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("ALL", (long) all.size());
        counts.put("TASKS", (long) tasks.size());
        counts.put("DOCUMENTS", (long) activity.size());
        counts.put("PROJECTS", (long) projects.size());
        counts.put("PEOPLE", (long) people.size());
        counts.put("MEETINGS", 0L);
        counts.put("DECISIONS", 0L);
        counts.put("TEAMS", 0L);

        List<GlobalSearchResultDto> finalResults = category.equals("ALL") ? all : switch (category) {
            case "TASKS" -> tasks;
            case "PROJECTS" -> projects;
            case "PEOPLE" -> people;
            case "DOCUMENTS" -> activity;
            default -> all;
        };

        return GlobalSearchResponseDto.builder()
            .query(query)
            .results(finalResults)
            .counts(counts)
            .total(finalResults.size())
            .build();
    }
}
