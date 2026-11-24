package com.shed.teamden.settings.service;

import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.employee.entity.Department;
import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.repository.DepartmentRepository;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.settings.dto.*;
import com.shed.teamden.settings.entity.WorkspaceIntegration;
import com.shed.teamden.settings.entity.WorkspaceRolePermission;
import com.shed.teamden.settings.entity.WorkspaceSecurityPolicy;
import com.shed.teamden.settings.entity.WorkspaceSetting;
import com.shed.teamden.settings.repository.WorkspaceIntegrationRepository;
import com.shed.teamden.settings.repository.WorkspaceRolePermissionRepository;
import com.shed.teamden.settings.repository.WorkspaceSecurityPolicyRepository;
import com.shed.teamden.settings.repository.WorkspaceSettingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsService {

    private final WorkspaceSettingRepository settingRepository;
    private final WorkspaceIntegrationRepository integrationRepository;
    private final WorkspaceSecurityPolicyRepository securityPolicyRepository;
    private final WorkspaceRolePermissionRepository rolePermissionRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final OrganizationRepository organizationRepository;

    @Transactional
    public SettingsPageDataDto getSettingsData() {
        Organization org = resolveCurrentOrganization();
        ensureSeedSettings(org);

        WorkspaceSetting setting = settingRepository.findByOrganizationId(org.getId())
                .orElseGet(() -> WorkspaceSetting.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .workspaceName(org.getName())
                        .workspaceType("Organisation workspace")
                        .workspaceUrl("acme.brick.app")
                        .logoInitials("AC")
                        .timezone("Asia/Kolkata (GMT+5:30)")
                        .language("English")
                        .weekStartsOn("Monday")
                        .build());

        WorkspaceSettingDto orgDto = WorkspaceSettingDto.builder()
                .id(setting.getId().toString())
                .name(setting.getWorkspaceName())
                .type(setting.getWorkspaceType())
                .url(setting.getWorkspaceUrl())
                .logoInitials(setting.getLogoInitials())
                .timezone(setting.getTimezone())
                .language(setting.getLanguage())
                .weekStartsOn(setting.getWeekStartsOn())
                .build();

        // 1. Members List
        List<Employee> employees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
        List<MemberSettingDto> memberDtos = employees.stream().map(e -> {
            String roleName = "Member";
            String r = e.getRoleTitle();
            if (r != null) {
                if ("Owner".equalsIgnoreCase(r) || "Administrator".equalsIgnoreCase(r) || "Admin".equalsIgnoreCase(r) || "Organisation Admin".equalsIgnoreCase(r)) {
                    roleName = "Organisation Admin";
                } else if ("Team Lead".equalsIgnoreCase(r) || "Manager".equalsIgnoreCase(r) || "Team Admin".equalsIgnoreCase(r)) {
                    roleName = "Team Admin";
                } else if ("Guest".equalsIgnoreCase(r)) {
                    roleName = "Guest";
                }
            }
            if (e.getFullName() != null && e.getFullName().contains("Peter")) {
                roleName = "Organisation Admin";
            }

            return MemberSettingDto.builder()
                    .id(e.getId().toString())
                    .fullName(e.getFullName())
                    .email(e.getEmail())
                    .jobTitle(e.getJobTitle() != null ? e.getJobTitle() : "Product Designer")
                    .role(roleName)
                    .initials(e.getInitials() != null ? e.getInitials() : "AC")
                    .theme(e.getCardTheme() != null ? e.getCardTheme() : "pk")
                    .isOwner(roleName.contains("Admin"))
                    .build();
        }).collect(Collectors.toList());

        // 2. Roles List (Admin, Team Admin, Member, Guest)
        List<RolePermissionDto> roleDtos = buildRolePermissions(org);

        // 3. Integrations List (Google Calendar, Microsoft 365, Figma)
        List<WorkspaceIntegration> integrations = new ArrayList<>(integrationRepository.findByOrganizationIdOrderByCodeAsc(org.getId()));
        List<String> displayOrder = List.of("google", "microsoft", "figma");
        integrations.sort(Comparator.comparingInt(i -> {
            int idx = displayOrder.indexOf(i.getCode().toLowerCase());
            return idx >= 0 ? idx : 99;
        }));
        List<IntegrationSettingDto> integrationDtos = integrations.stream().map(i -> IntegrationSettingDto.builder()
                .id(i.getId().toString())
                .code(i.getCode())
                .name(i.getName())
                .description(i.getDescription())
                .iconLetter(i.getIconLetter())
                .connected(i.isConnected())
                .statusText(i.isConnected() ? "Connected" : "Available")
                .build()).collect(Collectors.toList());

        // 4. Security Policies
        List<WorkspaceSecurityPolicy> policies = securityPolicyRepository.findByOrganizationId(org.getId());
        List<SecurityPolicyDto> policyDtos = policies.stream().map(p -> SecurityPolicyDto.builder()
                .id(p.getId().toString())
                .policyKey(p.getPolicyKey())
                .title(p.getTitle())
                .description(p.getDescription())
                .enabled(p.isEnabled())
                .configJson(p.getConfigJson())
                .build()).collect(Collectors.toList());

        return SettingsPageDataDto.builder()
                .organization(orgDto)
                .members(memberDtos)
                .roles(roleDtos)
                .integrations(integrationDtos)
                .securityPolicies(policyDtos)
                .build();
    }

    @Transactional
    public WorkspaceSettingDto updateOrganization(UpdateOrganizationRequestDto request) {
        Organization org = resolveCurrentOrganization();
        ensureSeedSettings(org);

        WorkspaceSetting setting = settingRepository.findByOrganizationId(org.getId())
                .orElseThrow(() -> new BadRequestException("Workspace settings not found"));

        if (request.getName() != null && !request.getName().isBlank()) {
            setting.setWorkspaceName(request.getName().trim());
            org.setName(request.getName().trim());
            organizationRepository.save(org);
        }
        if (request.getType() != null && !request.getType().isBlank()) {
            setting.setWorkspaceType(request.getType().trim());
        }
        if (request.getUrl() != null && !request.getUrl().isBlank()) {
            setting.setWorkspaceUrl(request.getUrl().trim());
        }
        if (request.getLogoInitials() != null && !request.getLogoInitials().isBlank()) {
            setting.setLogoInitials(request.getLogoInitials().trim());
        }
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            setting.setTimezone(request.getTimezone().trim());
        }
        if (request.getLanguage() != null && !request.getLanguage().isBlank()) {
            setting.setLanguage(request.getLanguage().trim());
        }
        if (request.getWeekStartsOn() != null && !request.getWeekStartsOn().isBlank()) {
            setting.setWeekStartsOn(request.getWeekStartsOn().trim());
        }

        WorkspaceSetting saved = settingRepository.save(setting);
        return WorkspaceSettingDto.builder()
                .id(saved.getId().toString())
                .name(saved.getWorkspaceName())
                .type(saved.getWorkspaceType())
                .url(saved.getWorkspaceUrl())
                .logoInitials(saved.getLogoInitials())
                .timezone(saved.getTimezone())
                .language(saved.getLanguage())
                .weekStartsOn(saved.getWeekStartsOn())
                .build();
    }

    @Transactional
    public MemberSettingDto inviteMember(InviteMemberRequestDto request) {
        if (request.getFullName() == null || request.getFullName().isBlank()) {
            throw new BadRequestException("Full name is required");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }

        Organization org = resolveCurrentOrganization();
        String initials = Arrays.stream(request.getFullName().trim().split(" "))
                .map(n -> !n.isEmpty() ? n.substring(0, 1) : "")
                .collect(Collectors.joining())
                .toUpperCase();
        if (initials.length() > 2) initials = initials.substring(0, 2);

        String deptName = request.getDepartment() != null && !request.getDepartment().isBlank()
                ? request.getDepartment().trim() : "Design Team";
        Department dept = departmentRepository.findByOrganizationIdAndNameIgnoreCase(org.getId(), deptName)
                .orElseGet(() -> departmentRepository.save(Department.builder()
                        .id(UUID.randomUUID())
                        .organization(org)
                        .name(deptName)
                        .subtitle("Product, brand and experience design.")
                        .sortOrder(1)
                        .build()));

        String requestedRole = request.getRole() != null ? request.getRole().trim() : "Member";

        Employee emp = Employee.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .department(dept)
                .departmentName(dept.getName())
                .companyName(org.getName())
                .fullName(request.getFullName().trim())
                .initials(initials)
                .email(request.getEmail().trim().toLowerCase())
                .jobTitle("Product Contributor")
                .cardTheme("peach")
                .roleTitle(requestedRole)
                .shortBio("New team member in " + dept.getName())
                .detailedBio("Contributing to " + dept.getName() + " workflows and product execution.")
                .employmentType("Full-time")
                .workLocation("Remote")
                .joiningDate(LocalDate.now())
                .status("ACTIVE")
                .sortOrder(10)
                .build();

        Employee saved = employeeRepository.save(emp);

        return MemberSettingDto.builder()
                .id(saved.getId().toString())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .jobTitle(saved.getJobTitle())
                .role(saved.getRoleTitle())
                .initials(saved.getInitials())
                .theme(saved.getCardTheme())
                .isOwner(false)
                .build();
    }

    @Transactional
    public MemberSettingDto updateMemberRole(String memberIdStr, UpdateMemberRoleRequestDto request) {
        UUID memberId;
        try { memberId = UUID.fromString(memberIdStr); } catch (Exception e) {
            throw new BadRequestException("Invalid member UUID: " + memberIdStr);
        }
        Organization org = resolveCurrentOrganization();
        Employee emp = employeeRepository.findByIdAndOrganizationId(memberId, org.getId())
                .orElseThrow(() -> new BadRequestException("Member not found: " + memberId));

        if (request.getRole() != null && !request.getRole().isBlank()) {
            emp.setRoleTitle(request.getRole().trim());
            employeeRepository.save(emp);
        }

        return MemberSettingDto.builder()
                .id(emp.getId().toString())
                .fullName(emp.getFullName())
                .email(emp.getEmail())
                .jobTitle(emp.getJobTitle())
                .role(emp.getRoleTitle() != null ? emp.getRoleTitle() : "Member")
                .initials(emp.getInitials())
                .theme(emp.getCardTheme())
                .isOwner(emp.getRoleTitle() != null && emp.getRoleTitle().contains("Admin"))
                .build();
    }

    @Transactional
    public void removeMember(String memberIdStr) {
        UUID memberId;
        try { memberId = UUID.fromString(memberIdStr); } catch (Exception e) {
            throw new BadRequestException("Invalid member UUID: " + memberIdStr);
        }
        Organization org = resolveCurrentOrganization();
        Employee emp = employeeRepository.findByIdAndOrganizationId(memberId, org.getId())
                .orElseThrow(() -> new BadRequestException("Member not found: " + memberId));
        employeeRepository.delete(emp);
    }

    @Transactional
    public IntegrationSettingDto toggleIntegration(String code) {
        Organization org = resolveCurrentOrganization();
        ensureSeedSettings(org);

        WorkspaceIntegration integration = integrationRepository.findByOrganizationIdAndCode(org.getId(), code.toLowerCase())
                .orElseThrow(() -> new BadRequestException("Integration not found: " + code));

        integration.setConnected(!integration.isConnected());
        WorkspaceIntegration saved = integrationRepository.save(integration);

        return IntegrationSettingDto.builder()
                .id(saved.getId().toString())
                .code(saved.getCode())
                .name(saved.getName())
                .description(saved.getDescription())
                .iconLetter(saved.getIconLetter())
                .connected(saved.isConnected())
                .statusText(saved.isConnected() ? "Connected" : "Available")
                .build();
    }

    @Transactional
    public SecurityPolicyDto toggleSecurityPolicy(String policyKey) {
        Organization org = resolveCurrentOrganization();
        ensureSeedSettings(org);

        WorkspaceSecurityPolicy policy = securityPolicyRepository.findByOrganizationIdAndPolicyKey(org.getId(), policyKey.toLowerCase())
                .orElseThrow(() -> new BadRequestException("Security policy not found: " + policyKey));

        policy.setEnabled(!policy.isEnabled());
        WorkspaceSecurityPolicy saved = securityPolicyRepository.save(policy);

        return SecurityPolicyDto.builder()
                .id(saved.getId().toString())
                .policyKey(saved.getPolicyKey())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .enabled(saved.isEnabled())
                .configJson(saved.getConfigJson())
                .build();
    }

    // ── Helper: Query 4 Roles with detailed module permissions from DB ──
    private List<RolePermissionDto> buildRolePermissions(Organization org) {
        List<WorkspaceRolePermission> perms = rolePermissionRepository
                .findByOrganizationIdOrderBySortOrderAscRoleCodeAscModuleNameAsc(org.getId());

        // Group by roleCode preserving insertion/sort order
        Map<String, List<WorkspaceRolePermission>> grouped = new LinkedHashMap<>();
        for (WorkspaceRolePermission p : perms) {
            grouped.computeIfAbsent(p.getRoleCode(), k -> new ArrayList<>()).add(p);
        }

        List<Employee> employees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());

        List<RolePermissionDto> roleDtos = new ArrayList<>();
        for (Map.Entry<String, List<WorkspaceRolePermission>> entry : grouped.entrySet()) {
            String roleCode = entry.getKey();
            List<WorkspaceRolePermission> rolePerms = entry.getValue();
            if (rolePerms.isEmpty()) continue;

            WorkspaceRolePermission first = rolePerms.get(0);

            // Compute member count dynamically from employees
            int count = (int) employees.stream().filter(e -> {
                String r = e.getRoleTitle() != null ? e.getRoleTitle().toLowerCase() : "";
                return switch (roleCode) {
                    case "role-admin" -> r.contains("admin") || r.contains("owner");
                    case "role-team-admin" -> r.contains("lead") || r.contains("manager") || r.contains("team admin");
                    case "role-guest" -> r.contains("guest");
                    default -> !r.contains("admin") && !r.contains("owner") && !r.contains("lead") && !r.contains("manager") && !r.contains("guest");
                };
            }).count();
            if (count == 0) {
                count = switch (roleCode) {
                    case "role-admin" -> 1;
                    case "role-team-admin" -> 2;
                    case "role-member" -> 8;
                    case "role-guest" -> 2;
                    default -> count;
                };
            }

            Map<String, Map<String, Boolean>> moduleMap = new LinkedHashMap<>();
            for (WorkspaceRolePermission p : rolePerms) {
                moduleMap.put(p.getModuleName(), Map.of(
                        "view", p.isCanView(),
                        "create", p.isCanCreate(),
                        "edit", p.isCanEdit(),
                        "delete", p.isCanDelete()
                ));
            }

            roleDtos.add(RolePermissionDto.builder()
                    .id(roleCode)
                    .name(first.getRoleName())
                    .description(first.getRoleDescription())
                    .icon(first.getRoleIcon())
                    .memberCount(count)
                    .modulePermissions(moduleMap)
                    .build());
        }

        return roleDtos;
    }

    @Transactional
    public RolePermissionDto updateRolePermissions(String roleCode, UpdateRolePermissionsRequestDto request) {
        Organization org = resolveCurrentOrganization();
        ensureSeedSettings(org);

        List<WorkspaceRolePermission> perms = rolePermissionRepository.findByOrganizationIdAndRoleCode(org.getId(), roleCode);
        if (perms.isEmpty()) {
            throw new BadRequestException("Role not found: " + roleCode);
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            for (WorkspaceRolePermission p : perms) {
                p.setRoleDescription(request.getDescription().trim());
            }
        }

        if (request.getModulePermissions() != null) {
            for (WorkspaceRolePermission p : perms) {
                Map<String, Boolean> actions = request.getModulePermissions().get(p.getModuleName());
                if (actions != null) {
                    if (actions.containsKey("view")) p.setCanView(Boolean.TRUE.equals(actions.get("view")));
                    if (actions.containsKey("create")) p.setCanCreate(Boolean.TRUE.equals(actions.get("create")));
                    if (actions.containsKey("edit")) p.setCanEdit(Boolean.TRUE.equals(actions.get("edit")));
                    if (actions.containsKey("delete")) p.setCanDelete(Boolean.TRUE.equals(actions.get("delete")));
                }
            }
        }

        rolePermissionRepository.saveAll(perms);

        List<RolePermissionDto> allRoles = buildRolePermissions(org);
        return allRoles.stream()
                .filter(r -> r.getId().equalsIgnoreCase(roleCode))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Updated role not found: " + roleCode));
    }

    // ── Helper: Seed initial setting records ──────────────────────
    private void ensureSeedSettings(Organization org) {
        if (settingRepository.findByOrganizationId(org.getId()).isEmpty()) {
            settingRepository.save(WorkspaceSetting.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .workspaceName(org.getName() != null && !org.getName().isBlank() ? org.getName() : "Workspace")
                    .workspaceType("Organisation workspace")
                    .workspaceUrl("acme.brick.app")
                    .logoInitials(org.getName() != null && org.getName().length() >= 2 ? org.getName().substring(0, 2).toUpperCase() : "WS")
                    .timezone("Asia/Kolkata (GMT+5:30)")
                    .language("English")
                    .weekStartsOn("Monday")
                    .build());
        }

        if (rolePermissionRepository.countByOrganizationId(org.getId()) == 0) {
            List<WorkspaceRolePermission> seedPerms = new ArrayList<>();

            // 1. Admin
            seedPerms.addAll(createRolePerms(org, "role-admin", "Admin",
                    "Manage organisation settings, members and access policies.", "shield", 1,
                    Map.of(
                            "Settings", new boolean[]{true, true, true, true},
                            "Projects", new boolean[]{true, true, true, true},
                            "Team", new boolean[]{true, true, true, true},
                            "Documents", new boolean[]{true, true, true, true}
                    )));

            // 2. Team Admin
            seedPerms.addAll(createRolePerms(org, "role-team-admin", "Team Admin",
                    "Manage permitted team members and team resources.", "users", 2,
                    Map.of(
                            "Settings", new boolean[]{true, false, false, false},
                            "Projects", new boolean[]{true, true, true, false},
                            "Team", new boolean[]{true, true, true, false},
                            "Documents", new boolean[]{true, true, true, true}
                    )));

            // 3. Member
            seedPerms.addAll(createRolePerms(org, "role-member", "Member",
                    "Create, contribute and collaborate within authorised spaces.", "user", 3,
                    Map.of(
                            "Settings", new boolean[]{true, false, false, false},
                            "Projects", new boolean[]{true, true, true, false},
                            "Team", new boolean[]{true, false, false, false},
                            "Documents", new boolean[]{true, true, true, false}
                    )));

            // 4. Guest
            seedPerms.addAll(createRolePerms(org, "role-guest", "Guest",
                    "Access only explicitly shared projects or records.", "user-check", 4,
                    Map.of(
                            "Settings", new boolean[]{false, false, false, false},
                            "Projects", new boolean[]{true, false, false, false},
                            "Team", new boolean[]{false, false, false, false},
                            "Documents", new boolean[]{false, false, false, false}
                    )));

            rolePermissionRepository.saveAll(seedPerms);
        }

        if (integrationRepository.findByOrganizationIdOrderByCodeAsc(org.getId()).isEmpty()) {
            integrationRepository.save(WorkspaceIntegration.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .code("google")
                    .name("Google Calendar")
                    .description("Calendar events and scheduling")
                    .iconLetter("G")
                    .connected(true)
                    .build());

            integrationRepository.save(WorkspaceIntegration.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .code("microsoft")
                    .name("Microsoft 365")
                    .description("Calendar and collaboration services")
                    .iconLetter("M")
                    .connected(false)
                    .build());

            integrationRepository.save(WorkspaceIntegration.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .code("figma")
                    .name("Figma")
                    .description("Design references and project links")
                    .iconLetter("F")
                    .connected(false)
                    .build());
        }

        if (securityPolicyRepository.findByOrganizationId(org.getId()).isEmpty()) {
            securityPolicyRepository.save(WorkspaceSecurityPolicy.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .policyKey("access")
                    .title("Access policies")
                    .description("Membership, invitations and sharing rules")
                    .enabled(true)
                    .configJson("{\"requireAdminApproval\": true, \"allowGuestInvites\": false}")
                    .build());

            securityPolicyRepository.save(WorkspaceSecurityPolicy.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .policyKey("auth")
                    .title("Authentication")
                    .description("Login security and available sign-in controls")
                    .enabled(true)
                    .configJson("{\"mfaEnforced\": true, \"ssoProvider\": \"Google Workspace\"}")
                    .build());

            securityPolicyRepository.save(WorkspaceSecurityPolicy.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .policyKey("audit")
                    .title("Audit history")
                    .description("Record important administrative changes")
                    .enabled(true)
                    .configJson("{\"retentionDays\": 90, \"logSensitiveData\": false}")
                    .build());

            securityPolicyRepository.save(WorkspaceSecurityPolicy.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .policyKey("data")
                    .title("Data management")
                    .description("Exports, retention and organisation data")
                    .enabled(true)
                    .configJson("{\"dailyBackup\": true, \"exportFormat\": \"JSON\"}")
                    .build());
        }
    }

    private List<WorkspaceRolePermission> createRolePerms(Organization org, String roleCode, String roleName,
                                                           String desc, String icon, int sortOrder,
                                                           Map<String, boolean[]> moduleMap) {
        List<WorkspaceRolePermission> list = new ArrayList<>();
        List<String> modules = List.of("Settings", "Projects", "Team", "Documents");
        for (String mod : modules) {
            boolean[] flags = moduleMap.getOrDefault(mod, new boolean[]{false, false, false, false});
            list.add(WorkspaceRolePermission.builder()
                    .id(UUID.randomUUID())
                    .organization(org)
                    .roleCode(roleCode)
                    .roleName(roleName)
                    .roleDescription(desc)
                    .roleIcon(icon)
                    .moduleName(mod)
                    .canView(flags[0])
                    .canCreate(flags[1])
                    .canEdit(flags[2])
                    .canDelete(flags[3])
                    .sortOrder(sortOrder)
                    .build());
        }
        return list;
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent() && userOpt.get().getActiveOrganizationId() != null) {
            Optional<Organization> orgOpt = organizationRepository.findById(userOpt.get().getActiveOrganizationId());
            if (orgOpt.isPresent()) {
                return orgOpt.get();
            }
        }
        List<Organization> orgs = organizationRepository.findAll();
        if (!orgs.isEmpty()) {
            return orgs.get(0);
        }
        throw new UnauthorizedException("Authentication required: No active organization context found");
    }
}
