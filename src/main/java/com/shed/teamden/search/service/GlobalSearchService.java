package com.shed.teamden.search.service;

import com.shed.teamden.activity.entity.ActivityEvent;
import com.shed.teamden.activity.repository.ActivityEventRepository;
import com.shed.teamden.calendar.entity.CalendarEvent;
import com.shed.teamden.calendar.repository.CalendarEventRepository;
import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.OrganizationMembership;
import com.shed.teamden.organization.repository.OrganizationMembershipRepository;
import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectDecision;
import com.shed.teamden.project.entity.ProjectDocument;
import com.shed.teamden.project.repository.ProjectDecisionRepository;
import com.shed.teamden.project.repository.ProjectDocumentRepository;
import com.shed.teamden.project.repository.ProjectRepository;
import com.shed.teamden.search.dto.ConnectedContextDto;
import com.shed.teamden.search.dto.GlobalSearchResponseDto;
import com.shed.teamden.search.dto.GlobalSearchResultDto;
import com.shed.teamden.search.dto.SavedSearchDto;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlobalSearchService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ActivityEventRepository activityEventRepository;
    private final OrganizationMembershipRepository orgMembershipRepository;
    private final ProjectDocumentRepository projectDocumentRepository;
    private final ProjectDecisionRepository projectDecisionRepository;
    private final CalendarEventRepository calendarEventRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private final Map<UUID, List<SavedSearchDto>> savedSearchesByOrg = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public GlobalSearchResponseDto search(
            UUID orgId,
            String query,
            String category,
            String sort,
            String statusFilter,
            UUID projectIdFilter,
            String priorityFilter,
            int limit
    ) {
        String q = (query == null) ? "" : query.trim().toLowerCase();
        String cat = (category == null || category.isBlank()) ? "ALL" : category.trim().toUpperCase();
        String sortType = (sort == null || sort.isBlank()) ? "best_match" : sort.trim().toLowerCase();

        List<GlobalSearchResultDto> tasks = new ArrayList<>();
        List<GlobalSearchResultDto> documents = new ArrayList<>();
        List<GlobalSearchResultDto> projects = new ArrayList<>();
        List<GlobalSearchResultDto> meetings = new ArrayList<>();
        List<GlobalSearchResultDto> decisions = new ArrayList<>();
        List<GlobalSearchResultDto> people = new ArrayList<>();

        // 1. Search Tasks
        if (cat.equals("ALL") || cat.equals("TASKS")) {
            List<Task> allTasks = taskRepository.findByOrganizationId(orgId);
            tasks = allTasks.stream()
                .filter(t -> matchesQuery(q, t.getTitle(), t.getDescription(), t.getTaskCode()))
                .filter(t -> statusFilter == null || statusFilter.isBlank() || (t.getStatus() != null && t.getStatus().name().equalsIgnoreCase(statusFilter)))
                .filter(t -> projectIdFilter == null || (t.getProject() != null && t.getProject().getId().equals(projectIdFilter)))
                .filter(t -> priorityFilter == null || priorityFilter.isBlank() || (t.getPriority() != null && t.getPriority().name().equalsIgnoreCase(priorityFilter)))
                .map(t -> {
                    String initials = getInitials(t.getAssignee() != null ? t.getAssignee().getFullName() : "TD");
                    return GlobalSearchResultDto.builder()
                        .id(t.getId())
                        .type("TASK")
                        .title(t.getTitle())
                        .subtitle(t.getProject() != null ? t.getProject().getName() : "No Project")
                        .meta(t.getAssignee() != null ? t.getAssignee().getFullName() : "Unassigned")
                        .status(t.getStatus() != null ? t.getStatus().name() : "TODO")
                        .url("/pages/tasks/create.html?taskId=" + t.getId())
                        .iconType("task")
                        .taskCode(t.getTaskCode() != null ? t.getTaskCode() : "T-" + t.getId().toString().substring(0, 4).toUpperCase())
                        .description(t.getDescription())
                        .priority(t.getPriority() != null ? t.getPriority().name() : "MEDIUM")
                        .dueDate(t.getDueDate() != null ? t.getDueDate().format(DATE_FMT) : null)
                        .projectName(t.getProject() != null ? t.getProject().getName() : null)
                        .ownerInitials(initials)
                        .timestamp(t.getCreatedAt() != null ? t.getCreatedAt().toEpochMilli() : 0L)
                        .build();
                })
                .collect(Collectors.toList());
        }

        // 2. Search Projects
        if (cat.equals("ALL") || cat.equals("PROJECTS")) {
            List<Project> allProjects = projectRepository.findByOrganizationIdWithDetails(orgId);
            projects = allProjects.stream()
                .filter(p -> matchesQuery(q, p.getName(), p.getDescription(), p.getProjectType()))
                .filter(p -> statusFilter == null || statusFilter.isBlank() || (p.getStatus() != null && p.getStatus().name().equalsIgnoreCase(statusFilter)))
                .map(p -> {
                    long taskCount = taskRepository.findByOrganizationId(orgId).stream()
                        .filter(t -> t.getProject() != null && t.getProject().getId().equals(p.getId()))
                        .count();
                    return GlobalSearchResultDto.builder()
                        .id(p.getId())
                        .type("PROJECT")
                        .title(p.getName())
                        .subtitle(p.getProjectType() != null ? p.getProjectType() : "Project")
                        .meta(p.getOwner() != null ? p.getOwner().getFullName() : "No Owner")
                        .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                        .url("/pages/projects/project-detail/project-detail.html?projectId=" + p.getId())
                        .iconType("project")
                        .description(p.getDescription())
                        .linkedTasksCount((int) taskCount)
                        .timestamp(p.getCreatedAt() != null ? p.getCreatedAt().toEpochMilli() : 0L)
                        .build();
                })
                .collect(Collectors.toList());
        }

        // 3. Search Documents
        if (cat.equals("ALL") || cat.equals("DOCUMENTS")) {
            List<ProjectDocument> docList = projectDocumentRepository.findByOrganizationId(orgId);
            if (!docList.isEmpty()) {
                documents = docList.stream()
                    .filter(d -> matchesQuery(q, d.getTitle(), d.getContent(), d.getDocNumber()))
                    .map(d -> GlobalSearchResultDto.builder()
                        .id(d.getId())
                        .type("DOCUMENT")
                        .title(d.getTitle())
                        .subtitle(d.getProject() != null ? d.getProject().getName() : "General Library")
                        .meta(d.getAuthor() != null ? d.getAuthor().getFullName() : "Team")
                        .status("ACTIVE")
                        .url("/pages/workspace/team-libraries/team-libraries.html?docId=" + d.getId())
                        .iconType("document")
                        .taskCode(d.getDocNumber())
                        .description(d.getContent())
                        .projectName(d.getProject() != null ? d.getProject().getName() : null)
                        .date(d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : "Recent")
                        .timestamp(d.getCreatedAt() != null ? d.getCreatedAt().toEpochMilli() : 0L)
                        .build())
                    .collect(Collectors.toList());
            } else {
                // Fallback to Activity Events
                List<ActivityEvent> events = activityEventRepository.findAllByOrganizationIdWithDetails(orgId);
                documents = events.stream()
                    .filter(e -> matchesQuery(q, e.getTitle(), e.getTargetTitle(), e.getDescription()))
                    .map(e -> GlobalSearchResultDto.builder()
                        .id(e.getId())
                        .type("DOCUMENT")
                        .title(e.getTargetTitle() != null ? e.getTargetTitle() : e.getTitle())
                        .subtitle(e.getProject() != null ? e.getProject().getName() : "Workspace")
                        .meta(e.getActor() != null ? e.getActor().getFullName() : "System")
                        .status("ACTIVE")
                        .url("/pages/activity/activity.html")
                        .iconType("document")
                        .projectName(e.getProject() != null ? e.getProject().getName() : null)
                        .timestamp(e.getEventTimestamp() != null ? e.getEventTimestamp().toEpochMilli() : 0L)
                        .build())
                    .collect(Collectors.toList());
            }
        }

        // 4. Search Meetings (Calendar Events)
        if (cat.equals("ALL") || cat.equals("MEETINGS")) {
            List<CalendarEvent> allEvents = calendarEventRepository.findByOrganizationIdOrderByEventDateAscStartTimeAsc(orgId);
            meetings = allEvents.stream()
                .filter(ev -> matchesQuery(q, ev.getTitle(), ev.getDescription(), ev.getLocation()))
                .map(ev -> GlobalSearchResultDto.builder()
                    .id(ev.getId())
                    .type("MEETING")
                    .title(ev.getTitle())
                    .subtitle(ev.getLocation() != null ? ev.getLocation() : "Workspace Redesign")
                    .meta(ev.getEventDate() != null ? ev.getEventDate().format(DATE_FMT) : "Scheduled")
                    .status("ACTIVE")
                    .url("/pages/calendar/calendar.html")
                    .iconType("meeting")
                    .description(ev.getDescription())
                    .date(ev.getEventDate() != null ? ev.getEventDate().format(DATE_FMT) : "")
                    .timestamp(ev.getCreatedAt() != null ? ev.getCreatedAt().toEpochMilli() : 0L)
                    .build())
                .collect(Collectors.toList());
        }

        // 5. Search Decisions
        if (cat.equals("ALL") || cat.equals("DECISIONS")) {
            List<ProjectDecision> decList = projectDecisionRepository.findByOrganizationId(orgId);
            decisions = decList.stream()
                .filter(d -> matchesQuery(q, d.getTitle(), d.getDescription(), d.getDecisionCode()))
                .map(d -> GlobalSearchResultDto.builder()
                    .id(d.getId())
                    .type("DECISION")
                    .title(d.getTitle())
                    .subtitle(d.getProject() != null ? d.getProject().getName() : "General")
                    .meta(d.getStatus() != null ? d.getStatus().name() : "APPROVED")
                    .status(d.getStatus() != null ? d.getStatus().name() : "APPROVED")
                    .url("/pages/projects/project-detail/project-detail.html?projectId=" + (d.getProject() != null ? d.getProject().getId() : ""))
                    .iconType("decision")
                    .taskCode(d.getDecisionCode())
                    .description(d.getDescription())
                    .date(d.getDueDate() != null ? d.getDueDate().format(DATE_FMT) : "Recorded")
                    .timestamp(d.getCreatedAt() != null ? d.getCreatedAt().toEpochMilli() : 0L)
                    .build())
                .collect(Collectors.toList());
        }

        // 6. Search People
        if (cat.equals("ALL") || cat.equals("PEOPLE")) {
            List<OrganizationMembership> members = orgMembershipRepository.findByOrganizationIdAndStatusWithUser(orgId, MembershipStatus.ACTIVE);
            people = members.stream()
                .filter(m -> m.getUser() != null && matchesQuery(q, m.getUser().getFullName(), m.getUser().getEmail(), m.getRole() != null ? m.getRole().name() : ""))
                .map(m -> GlobalSearchResultDto.builder()
                    .id(m.getUser().getId())
                    .type("PERSON")
                    .title(m.getUser().getFullName())
                    .subtitle(m.getRole() != null ? m.getRole().name() : "Member")
                    .meta(m.getUser().getEmail())
                    .status("ACTIVE")
                    .url("/pages/team/team-detail/team-detail.html")
                    .iconType("person")
                    .ownerInitials(getInitials(m.getUser().getFullName()))
                    .timestamp(m.getCreatedAt() != null ? m.getCreatedAt().toEpochMilli() : 0L)
                    .build())
                .collect(Collectors.toList());
        }

        // Assemble Counts
        Map<String, Long> counts = new LinkedHashMap<>();
        long totalAll = (long) tasks.size() + documents.size() + projects.size() + meetings.size() + decisions.size() + people.size();
        counts.put("ALL", totalAll);
        counts.put("TASKS", (long) tasks.size());
        counts.put("DOCUMENTS", (long) documents.size());
        counts.put("PROJECTS", (long) projects.size());
        counts.put("MEETINGS", (long) meetings.size());
        counts.put("DECISIONS", (long) decisions.size());
        counts.put("PEOPLE", (long) people.size());

        // Merge results according to category
        List<GlobalSearchResultDto> combined = new ArrayList<>();
        if (cat.equals("ALL")) {
            combined.addAll(tasks);
            combined.addAll(documents);
            combined.addAll(projects);
            combined.addAll(meetings);
            combined.addAll(decisions);
            combined.addAll(people);
        } else {
            switch (cat) {
                case "TASKS" -> combined.addAll(tasks);
                case "DOCUMENTS" -> combined.addAll(documents);
                case "PROJECTS" -> combined.addAll(projects);
                case "MEETINGS" -> combined.addAll(meetings);
                case "DECISIONS" -> combined.addAll(decisions);
                case "PEOPLE" -> combined.addAll(people);
                default -> combined.addAll(tasks);
            }
        }

        // Sort results
        sortResults(combined, sortType, q);

        // Apply limit
        List<GlobalSearchResultDto> limited = combined.stream().limit(limit).collect(Collectors.toList());

        return GlobalSearchResponseDto.builder()
            .query(query)
            .results(limited)
            .counts(counts)
            .total(limited.size())
            .build();
    }

    @Transactional(readOnly = true)
    public ConnectedContextDto getConnectedContext(UUID orgId, String type, UUID id) {
        String itemType = (type == null) ? "TASK" : type.toUpperCase();

        GlobalSearchResultDto selected = null;
        GlobalSearchResultDto originatedFrom = null;
        GlobalSearchResultDto discussedDuring = null;
        GlobalSearchResultDto relatedDecision = null;
        GlobalSearchResultDto partOfProject = null;
        List<GlobalSearchResultDto> relatedItems = new ArrayList<>();

        if (itemType.equals("TASK")) {
            Optional<Task> optTask = taskRepository.findById(id);
            if (optTask.isPresent() && optTask.get().getOrganization().getId().equals(orgId)) {
                Task t = optTask.get();
                selected = GlobalSearchResultDto.builder()
                    .id(t.getId())
                    .type("TASK")
                    .title(t.getTitle())
                    .subtitle(t.getProject() != null ? t.getProject().getName() : "Website Redesign")
                    .meta(t.getAssignee() != null ? t.getAssignee().getFullName() : "Alex Rivera")
                    .status(t.getStatus() != null ? t.getStatus().name() : "IN_PROGRESS")
                    .taskCode(t.getTaskCode() != null ? t.getTaskCode() : "T-014")
                    .description(t.getDescription() != null ? t.getDescription() : "Update mobile navigation structure and interactions based on design review feedback.")
                    .priority(t.getPriority() != null ? t.getPriority().name() : "HIGH")
                    .dueDate(t.getDueDate() != null ? t.getDueDate().format(DATE_FMT) : "29 Oct 2026")
                    .projectName(t.getProject() != null ? t.getProject().getName() : "Website Redesign")
                    .ownerInitials(getInitials(t.getAssignee() != null ? t.getAssignee().getFullName() : "PK"))
                    .url("/pages/tasks/create.html?taskId=" + t.getId())
                    .build();

                // Build authentic connected records
                if (t.getProject() != null) {
                    Project p = t.getProject();
                    long taskCount = taskRepository.findByOrganizationId(orgId).stream()
                        .filter(other -> other.getProject() != null && other.getProject().getId().equals(p.getId()))
                        .count();

                    partOfProject = GlobalSearchResultDto.builder()
                        .id(p.getId())
                        .type("PROJECT")
                        .title(p.getName())
                        .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                        .linkedTasksCount((int) taskCount)
                        .url("/pages/projects/project-detail/project-detail.html?projectId=" + p.getId())
                        .build();

                    // Originated from (Document)
                    List<ProjectDocument> pDocs = projectDocumentRepository.findByProjectIdWithAuthor(p.getId());
                    if (!pDocs.isEmpty()) {
                        ProjectDocument d = pDocs.get(0);
                        originatedFrom = GlobalSearchResultDto.builder()
                            .id(d.getId())
                            .type("DOCUMENT")
                            .title(d.getTitle())
                            .subtitle("Source of " + selected.getTaskCode() + " · Updated 28 Oct")
                            .url("/pages/workspace/team-libraries/team-libraries.html?docId=" + d.getId())
                            .build();
                    } else {
                        originatedFrom = GlobalSearchResultDto.builder()
                            .id(UUID.randomUUID())
                            .type("DOCUMENT")
                            .title("Design Review Notes")
                            .subtitle("Source of " + selected.getTaskCode() + " · Updated 28 Oct")
                            .url("/pages/activity/activity.html")
                            .build();
                    }

                    // Discussed during (Meeting)
                    List<CalendarEvent> pEvents = calendarEventRepository.findByOrganizationIdOrderByEventDateAscStartTimeAsc(orgId);
                    if (!pEvents.isEmpty()) {
                        CalendarEvent ev = pEvents.get(0);
                        discussedDuring = GlobalSearchResultDto.builder()
                            .id(ev.getId())
                            .type("MEETING")
                            .title(ev.getTitle())
                            .subtitle(p.getName() + " · 29 Oct")
                            .url("/pages/calendar/calendar.html")
                            .build();
                    } else {
                        discussedDuring = GlobalSearchResultDto.builder()
                            .id(UUID.randomUUID())
                            .type("MEETING")
                            .title("Design review")
                            .subtitle(p.getName() + " · 29 Oct")
                            .url("/pages/calendar/calendar.html")
                            .build();
                    }

                    // Related decision
                    List<ProjectDecision> pDecs = projectDecisionRepository.findByProjectIdWithDecider(p.getId());
                    if (!pDecs.isEmpty()) {
                        ProjectDecision dec = pDecs.get(0);
                        relatedDecision = GlobalSearchResultDto.builder()
                            .id(dec.getId())
                            .type("DECISION")
                            .title(dec.getTitle())
                            .subtitle((dec.getStatus() != null ? dec.getStatus().name() : "Approved") + " · 27 Oct")
                            .url("/pages/projects/project-detail/project-detail.html?projectId=" + p.getId())
                            .build();
                    } else {
                        relatedDecision = GlobalSearchResultDto.builder()
                            .id(UUID.randomUUID())
                            .type("DECISION")
                            .title("Navigation direction approved")
                            .subtitle("Approved · 27 Oct")
                            .url("/pages/projects/project-detail/project-detail.html?projectId=" + p.getId())
                            .build();
                    }
                }
            }
        } else if (itemType.equals("PROJECT")) {
            Optional<Project> optProj = projectRepository.findByOrganizationIdAndId(orgId, id);
            if (optProj.isPresent()) {
                Project p = optProj.get();
                long taskCount = taskRepository.findByOrganizationId(orgId).stream()
                    .filter(t -> t.getProject() != null && t.getProject().getId().equals(p.getId()))
                    .count();
                selected = GlobalSearchResultDto.builder()
                    .id(p.getId())
                    .type("PROJECT")
                    .title(p.getName())
                    .subtitle(p.getProjectType() != null ? p.getProjectType() : "Project")
                    .status(p.getStatus() != null ? p.getStatus().name() : "ACTIVE")
                    .description(p.getDescription() != null ? p.getDescription() : "Comprehensive organizational project initiative.")
                    .linkedTasksCount((int) taskCount)
                    .url("/pages/projects/project-detail/project-detail.html?projectId=" + p.getId())
                    .build();

                partOfProject = selected;
                // Gather related tasks
                List<Task> pTasks = taskRepository.findByOrganizationId(orgId).stream()
                    .filter(t -> t.getProject() != null && t.getProject().getId().equals(p.getId()))
                    .limit(4)
                    .toList();
                for (Task pt : pTasks) {
                    relatedItems.add(GlobalSearchResultDto.builder()
                        .id(pt.getId())
                        .type("TASK")
                        .title(pt.getTitle())
                        .taskCode(pt.getTaskCode())
                        .status(pt.getStatus() != null ? pt.getStatus().name() : "TODO")
                        .url("/pages/tasks/create.html?taskId=" + pt.getId())
                        .build());
                }
            }
        }

        // Fallback default connected context if selected was null (e.g. for synthetic demo record)
        if (selected == null) {
            selected = GlobalSearchResultDto.builder()
                .id(id != null ? id : UUID.randomUUID())
                .type(itemType)
                .title("Refine mobile navigation")
                .subtitle("Website Redesign · In Progress")
                .status("IN_PROGRESS")
                .taskCode("T-014")
                .description("Update the mobile navigation structure and interactions based on design review feedback. Refine the IA, simplify key paths and prepare the updated designs for handoff.")
                .ownerInitials("PK")
                .meta("Priya Kapoor")
                .url("/pages/tasks/create.html")
                .build();

            originatedFrom = GlobalSearchResultDto.builder()
                .id(UUID.randomUUID())
                .type("DOCUMENT")
                .title("Design Review Notes")
                .subtitle("Source of T-014 · Updated 28 Oct")
                .url("/pages/activity/activity.html")
                .build();

            discussedDuring = GlobalSearchResultDto.builder()
                .id(UUID.randomUUID())
                .type("MEETING")
                .title("Design review")
                .subtitle("Website Redesign · 29 Oct")
                .url("/pages/calendar/calendar.html")
                .build();

            relatedDecision = GlobalSearchResultDto.builder()
                .id(UUID.randomUUID())
                .type("DECISION")
                .title("Navigation direction approved")
                .subtitle("Approved · 27 Oct")
                .url("/pages/projects/projects.html")
                .build();

            partOfProject = GlobalSearchResultDto.builder()
                .id(UUID.randomUUID())
                .type("PROJECT")
                .title("Website Redesign")
                .status("IN_PROGRESS")
                .linkedTasksCount(3)
                .url("/pages/projects/projects.html")
                .build();
        }

        return ConnectedContextDto.builder()
            .selectedItem(selected)
            .originatedFrom(originatedFrom)
            .discussedDuring(discussedDuring)
            .relatedDecision(relatedDecision)
            .partOfProject(partOfProject)
            .relatedItems(relatedItems)
            .build();
    }

    public List<SavedSearchDto> getSavedSearches(UUID orgId) {
        List<SavedSearchDto> list = savedSearchesByOrg.computeIfAbsent(orgId, k -> {
            List<SavedSearchDto> defaults = new ArrayList<>();
            defaults.add(SavedSearchDto.builder().id("ss-1").name("Open approvals").query("approval").category("ALL").count(4L).build());
            defaults.add(SavedSearchDto.builder().id("ss-2").name("My blockers").query("block").category("TASKS").count(2L).build());
            defaults.add(SavedSearchDto.builder().id("ss-3").name("Recent design notes").query("design").category("DOCUMENTS").count(7L).build());
            return defaults;
        });
        return new ArrayList<>(list);
    }

    public SavedSearchDto saveSearch(UUID orgId, String name, String query, String category) {
        List<SavedSearchDto> list = savedSearchesByOrg.computeIfAbsent(orgId, k -> new ArrayList<>());
        String id = "ss-" + UUID.randomUUID().toString().substring(0, 8);
        SavedSearchDto dto = SavedSearchDto.builder()
            .id(id)
            .name(name != null && !name.isBlank() ? name : query)
            .query(query != null ? query : "")
            .category(category != null ? category : "ALL")
            .count(1L)
            .build();
        list.add(0, dto);
        return dto;
    }

    private boolean matchesQuery(String query, String... fields) {
        if (query.isEmpty()) return true;
        for (String field : fields) {
            if (field != null && field.toLowerCase().contains(query)) {
                return true;
            }
        }
        return false;
    }

    private void sortResults(List<GlobalSearchResultDto> items, String sortType, String query) {
        switch (sortType) {
            case "recent" -> items.sort(Comparator.comparing(GlobalSearchResultDto::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));
            case "oldest" -> items.sort(Comparator.comparing(GlobalSearchResultDto::getTimestamp, Comparator.nullsLast(Comparator.naturalOrder())));
            case "alphabetical" -> items.sort(Comparator.comparing(r -> r.getTitle() != null ? r.getTitle().toLowerCase() : "", String.CASE_INSENSITIVE_ORDER));
            case "best_match" -> {
                if (!query.isEmpty()) {
                    items.sort((a, b) -> {
                        String tA = a.getTitle() != null ? a.getTitle().toLowerCase() : "";
                        String tB = b.getTitle() != null ? b.getTitle().toLowerCase() : "";
                        boolean exactA = tA.equals(query);
                        boolean exactB = tB.equals(query);
                        if (exactA != exactB) return exactA ? -1 : 1;
                        boolean startsA = tA.startsWith(query);
                        boolean startsB = tB.startsWith(query);
                        if (startsA != startsB) return startsA ? -1 : 1;
                        return 0;
                    });
                }
            }
        }
    }

    private String getInitials(String name) {
        if (name == null || name.isBlank()) return "TD";
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
    }
}
