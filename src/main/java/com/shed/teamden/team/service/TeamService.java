package com.shed.teamden.team.service;

import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.employee.entity.Department;
import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.repository.DepartmentRepository;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.team.dto.*;
import com.shed.teamden.team.entity.Team;
import com.shed.teamden.team.entity.TeamLeadAssignment;
import com.shed.teamden.team.entity.TeamMember;
import com.shed.teamden.team.entity.TeamPermission;
import com.shed.teamden.team.repository.TeamLeadAssignmentRepository;
import com.shed.teamden.team.repository.TeamMemberRepository;
import com.shed.teamden.team.repository.TeamPermissionRepository;
import com.shed.teamden.team.repository.TeamRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private static final String ROLE_TEAM_LEAD = "Team Lead";
    private static final String ROLE_ASSISTANT_LEAD = "Assistant Team Lead";
    private static final String ROLE_MEMBER = "Member";

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamLeadAssignmentRepository teamLeadAssignmentRepository;
    private final TeamPermissionRepository teamPermissionRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TeamDto> getTeams() {
        Organization org = resolveCurrentOrganization();
        List<Team> teams = teamRepository.findByOrganizationIdWithDetails(org.getId());
        return teams.stream().map(this::toSummaryDto).toList();
    }

    @Transactional(readOnly = true)
    public TeamDto getTeamDetail(UUID teamId) {
        Organization org = resolveCurrentOrganization();
        Team team = teamRepository.findByIdAndOrganizationId(teamId, org.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + teamId));

        List<TeamMember> members = teamMemberRepository.findByTeamIdWithEmployee(teamId);
        List<TeamPermission> permissions = teamPermissionRepository.findByTeamId(teamId);

        return toFullDto(team, members, permissions);
    }

    @Transactional(readOnly = true)
    public TeamOptionsDto getTeamOptions() {
        Organization org = resolveCurrentOrganization();

        List<TeamOptionsDto.DepartmentOptionDto> departments = departmentRepository
                .findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream()
                .map(d -> TeamOptionsDto.DepartmentOptionDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .subtitle(d.getSubtitle())
                        .build())
                .toList();

        List<TeamOptionsDto.EmployeeOptionDto> employees = employeeRepository
                .findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId())
                .stream()
                .map(e -> TeamOptionsDto.EmployeeOptionDto.builder()
                        .id(e.getId())
                        .name(e.getFullName())
                        .initials(e.getInitials())
                        .jobTitle(e.getJobTitle())
                        .departmentName(e.getDepartmentName())
                        .email(e.getEmail())
                        .cardTheme(e.getCardTheme())
                        .status(e.getStatus())
                        .build())
                .toList();

        List<String> categories = List.of(
                "Development",
                "Design",
                "Marketing",
                "Sales",
                "Human Resources",
                "Finance",
                "Operations",
                "Customer Support",
                "Research",
                "Other"
        );

        List<String> visibilityOptions = List.of("Organization-wide", "Restricted");

        List<String> defaultPermissions = List.of(
                "View Projects",
                "Manage Tasks",
                "Invite Members",
                "Chronicle Updates"
        );

        List<String> memberRoles = List.of(
                ROLE_TEAM_LEAD,
                ROLE_ASSISTANT_LEAD,
                "Core Contributor",
                "Specialist",
                "Reviewer",
                ROLE_MEMBER
        );

        return TeamOptionsDto.builder()
                .departments(departments)
                .employees(employees)
                .categories(categories)
                .visibilityOptions(visibilityOptions)
                .defaultPermissions(defaultPermissions)
                .memberRoles(memberRoles)
                .build();
    }

    @Transactional
    public TeamDto createTeam(CreateTeamRequestDto req) {
        if (req == null) {
            throw new BadRequestException("Team request cannot be null");
        }
        if (req.getName() == null || req.getName().isBlank()) {
            throw new BadRequestException("Team name is required");
        }
        if (req.getDescription() == null || req.getDescription().isBlank()) {
            throw new BadRequestException("Team description is required");
        }
        if (req.getDepartmentId() == null) {
            throw new BadRequestException("Department is required");
        }
        if (req.getTeamLeadId() == null) {
            throw new BadRequestException("Team lead is required");
        }
        if (req.getMembers() == null || req.getMembers().isEmpty()) {
            throw new BadRequestException("At least one team member is required");
        }

        Organization org = resolveCurrentOrganization();
        User currentUser = resolveCurrentUser();

        String trimmedName = req.getName().trim();
        if (teamRepository.existsByOrganizationIdAndNameIgnoreCase(org.getId(), trimmedName)) {
            throw new BadRequestException("A team with name '" + trimmedName + "' already exists");
        }

        // Generate team code
        String code = req.getCode() != null && !req.getCode().isBlank()
                ? req.getCode().trim().toUpperCase(Locale.ROOT)
                : generateTeamCode(org.getId(), trimmedName);

        if (teamRepository.existsByOrganizationIdAndCodeIgnoreCase(org.getId(), code)) {
            code = code + "-" + (System.currentTimeMillis() % 1000);
        }

        Department department = departmentRepository.findById(req.getDepartmentId())
                .filter(d -> d.getOrganization().getId().equals(org.getId()))
                .orElseThrow(() -> new BadRequestException("Selected department does not exist in this organization"));

        Employee teamLead = employeeRepository.findById(req.getTeamLeadId())
                .filter(e -> e.getOrganization().getId().equals(org.getId()))
                .orElseThrow(() -> new BadRequestException("Selected team lead is not an active member of this organization"));

        Employee assistantLead = null;
        if (req.getAssistantTeamLeadId() != null) {
            assistantLead = employeeRepository.findById(req.getAssistantTeamLeadId())
                    .filter(e -> e.getOrganization().getId().equals(org.getId()))
                    .orElseThrow(() -> new BadRequestException("Selected assistant lead is not an active member of this organization"));
        }

        Employee reportingManager = null;
        if (req.getReportingManagerId() != null) {
            reportingManager = employeeRepository.findById(req.getReportingManagerId())
                    .filter(e -> e.getOrganization().getId().equals(org.getId()))
                    .orElseThrow(() -> new BadRequestException("Selected reporting manager is not an active member of this organization"));
        }

        String visibility = (req.getVisibility() != null && !req.getVisibility().isBlank())
                ? req.getVisibility().trim().toUpperCase(Locale.ROOT).replace(" ", "_").replace("-", "_")
                : "ORGANIZATION_WIDE";

        Team team = Team.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .department(department)
                .name(trimmedName)
                .code(code)
                .description(req.getDescription().trim())
                .category(req.getCategory() != null && !req.getCategory().isBlank() ? req.getCategory().trim() : "General")
                .status("ACTIVE")
                .logoUrl(req.getLogoUrl() != null && !req.getLogoUrl().isBlank() ? req.getLogoUrl().trim() : null)
                .teamLead(teamLead)
                .assistantTeamLead(assistantLead)
                .reportingManager(reportingManager)
                .visibility(visibility)
                .createdBy(currentUser)
                .build();

        team = teamRepository.save(team);

        // Process team members (ensure Team Lead and Assistant Lead are included)
        Map<UUID, String> memberRoleMap = new LinkedHashMap<>();
        // Automatically make Team Lead a member
        memberRoleMap.put(teamLead.getId(), ROLE_TEAM_LEAD);

        if (assistantLead != null) {
            memberRoleMap.put(assistantLead.getId(), ROLE_ASSISTANT_LEAD);
        }

        for (TeamMemberInputDto memberInput : req.getMembers()) {
            if (memberInput.getEmployeeId() != null) {
                String role = memberInput.getMemberRole();
                if (role == null || role.isBlank()) {
                    role = ROLE_MEMBER;
                }
                // Don't overwrite leadership roles
                memberRoleMap.putIfAbsent(memberInput.getEmployeeId(), role);
            }
        }

        List<TeamMember> savedMembers = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (Map.Entry<UUID, String> entry : memberRoleMap.entrySet()) {
            Employee emp = employeeRepository.findById(entry.getKey())
                    .filter(e -> e.getOrganization().getId().equals(org.getId()))
                    .orElse(null);

            if (emp != null) {
                TeamMember member = TeamMember.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .team(team)
                        .employee(emp)
                        .memberRole(entry.getValue())
                        .status("ACTIVE")
                        .joinedDate(now)
                        .build();
                savedMembers.add(teamMemberRepository.save(member));
            }
        }

        // Save Team Lead Assignments
        TeamLeadAssignment primaryAssignment = TeamLeadAssignment.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .team(team)
                .leadEmployee(teamLead)
                .roleType("TEAM_LEAD")
                .assignedBy(currentUser)
                .build();
        teamLeadAssignmentRepository.save(primaryAssignment);

        if (assistantLead != null) {
            TeamLeadAssignment assistantAssignment = TeamLeadAssignment.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .team(team)
                    .leadEmployee(assistantLead)
                    .roleType("ASSISTANT_LEAD")
                    .assignedBy(currentUser)
                    .build();
            teamLeadAssignmentRepository.save(assistantAssignment);
        }

        // Save Default Team Permissions
        List<String> defaultPermKeys = List.of(
                "VIEW_PROJECTS",
                "MANAGE_TASKS",
                "INVITE_MEMBERS",
                "CHRONICLE_UPDATES"
        );
        List<TeamPermission> savedPermissions = new ArrayList<>();
        for (String permKey : defaultPermKeys) {
            TeamPermission perm = TeamPermission.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .team(team)
                    .permissionKey(permKey)
                    .permissionValue("ENABLED")
                    .build();
            savedPermissions.add(teamPermissionRepository.save(perm));
        }

        return toFullDto(team, savedMembers, savedPermissions);
    }

    private String generateTeamCode(UUID orgId, String teamName) {
        String clean = teamName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase(Locale.ROOT);
        String prefix = clean.length() >= 4 ? clean.substring(0, 4) : (clean + "TEAM").substring(0, 4);
        long count = teamRepository.countByOrganizationId(orgId) + 1;
        return "TEAM-" + prefix + "-" + String.format(Locale.ROOT, "%02d", count);
    }

    private TeamDto toSummaryDto(Team t) {
        long count = teamMemberRepository.countByTeamId(t.getId());
        return TeamDto.builder()
                .id(t.getId())
                .name(t.getName())
                .code(t.getCode())
                .description(t.getDescription())
                .departmentId(t.getDepartment() != null ? t.getDepartment().getId() : null)
                .departmentName(t.getDepartment() != null ? t.getDepartment().getName() : "")
                .category(t.getCategory())
                .status(t.getStatus())
                .logoUrl(t.getLogoUrl())
                .visibility(t.getVisibility())
                .teamLeadId(t.getTeamLead() != null ? t.getTeamLead().getId() : null)
                .teamLeadName(t.getTeamLead() != null ? t.getTeamLead().getFullName() : "")
                .teamLeadInitials(t.getTeamLead() != null ? t.getTeamLead().getInitials() : "")
                .teamLeadJobTitle(t.getTeamLead() != null ? t.getTeamLead().getJobTitle() : "")
                .assistantTeamLeadId(t.getAssistantTeamLead() != null ? t.getAssistantTeamLead().getId() : null)
                .assistantTeamLeadName(t.getAssistantTeamLead() != null ? t.getAssistantTeamLead().getFullName() : null)
                .reportingManagerId(t.getReportingManager() != null ? t.getReportingManager().getId() : null)
                .reportingManagerName(t.getReportingManager() != null ? t.getReportingManager().getFullName() : null)
                .memberCount((int) count)
                .createdAt(t.getCreatedAt())
                .createdByName(t.getCreatedBy() != null ? t.getCreatedBy().getFullName() : "System")
                .build();
    }

    private TeamDto toFullDto(Team t, List<TeamMember> members, List<TeamPermission> permissions) {
        List<TeamMemberDto> memberDtos = members.stream()
                .map(m -> {
                    Employee e = m.getEmployee();
                    return TeamMemberDto.builder()
                            .id(m.getId())
                            .employeeId(e != null ? e.getId() : null)
                            .fullName(e != null ? e.getFullName() : "")
                            .initials(e != null ? e.getInitials() : "")
                            .jobTitle(e != null ? e.getJobTitle() : "")
                            .departmentName(e != null ? e.getDepartmentName() : "")
                            .email(e != null ? e.getEmail() : "")
                            .cardTheme(e != null ? e.getCardTheme() : "pk")
                            .memberRole(m.getMemberRole())
                            .status(m.getStatus())
                            .joinedDate(m.getJoinedDate())
                            .build();
                })
                .toList();

        List<String> permKeys = permissions.stream()
                .map(TeamPermission::getPermissionKey)
                .toList();

        TeamDto dto = toSummaryDto(t);
        dto.setMembers(memberDtos);
        dto.setMemberCount(memberDtos.size());
        dto.setPermissions(permKeys);
        return dto;
    }

    private Organization resolveCurrentOrganization() {
        CustomUserDetails userDetails = SecurityUtils.getAuthenticatedUser().orElse(null);
        if (userDetails == null || userDetails.getActiveOrganizationId() == null) {
            throw new UnauthorizedException("No active organization found in session");
        }
        return organizationRepository.findById(userDetails.getActiveOrganizationId())
                .orElseThrow(() -> new UnauthorizedException("Active organization not found"));
    }

    private User resolveCurrentUser() {
        CustomUserDetails userDetails = SecurityUtils.getAuthenticatedUser().orElse(null);
        if (userDetails == null || userDetails.getId() == null) {
            return null;
        }
        return userRepository.findById(userDetails.getId()).orElse(null);
    }
}
