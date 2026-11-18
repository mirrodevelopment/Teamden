package com.shed.teamden.employee.service;

import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.employee.dto.*;
import com.shed.teamden.employee.entity.*;
import com.shed.teamden.employee.repository.*;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.entity.OrganizationStatus;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.entity.UserStatus;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeResponsibilityRepository responsibilityRepository;
    private final WorkspaceRoleRepository roleRepository;
    private final EmployeeCollaborationRepository collaborationRepository;
    private final EmployeeSharedDocumentRepository sharedDocumentRepository;
    private final TaskRepository taskRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    @Transactional
    public EmployeeDirectoryResponseDto getDirectory(String search, String departmentFilter, String roleFilter, UUID activeId) {
        Organization org = resolveCurrentOrganization();
        ensureSeedData(org);

        List<Employee> allEmployees;
        if (search != null && !search.trim().isEmpty()) {
            allEmployees = employeeRepository.searchEmployees(org.getId(), search.trim());
        } else {
            allEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
        }

        // Filter by department if requested
        if (departmentFilter != null && !departmentFilter.trim().isEmpty() && !"all".equalsIgnoreCase(departmentFilter.trim())) {
            allEmployees = allEmployees.stream()
                    .filter(e -> departmentFilter.equalsIgnoreCase(e.getDepartmentName()) ||
                            (e.getDepartment() != null && departmentFilter.equalsIgnoreCase(e.getDepartment().getName())))
                    .collect(Collectors.toList());
        }

        // Filter by role if requested
        if (roleFilter != null && !roleFilter.trim().isEmpty() && !"all".equalsIgnoreCase(roleFilter.trim())) {
            allEmployees = allEmployees.stream()
                    .filter(e -> roleFilter.equalsIgnoreCase(e.getRoleTitle()))
                    .collect(Collectors.toList());
        }

        List<EmployeeDto> employeeDtos = allEmployees.stream()
                .map(this::mapToEmployeeDto)
                .collect(Collectors.toList());

        // Resolve active employee detail
        Employee activeEmployee = null;
        if (activeId != null) {
            activeEmployee = allEmployees.stream().filter(e -> e.getId().equals(activeId)).findFirst().orElse(null);
        }
        if (activeEmployee == null) {
            // Default to Alex R. if available, or first employee
            activeEmployee = allEmployees.stream()
                    .filter(e -> "Alex R.".equalsIgnoreCase(e.getFullName()) || "AR".equalsIgnoreCase(e.getInitials()))
                    .findFirst()
                    .orElse(allEmployees.isEmpty() ? null : allEmployees.get(0));
        }

        EmployeeDetailDto detailDto = activeEmployee != null ? buildEmployeeDetail(activeEmployee) : null;

        final List<Employee> finalEmployees = allEmployees;
        List<DepartmentDto> departmentDtos = departmentRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream().map(d -> DepartmentDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .subtitle(d.getSubtitle())
                        .memberCount((int) finalEmployees.stream()
                                .filter(e -> d.getName().equalsIgnoreCase(e.getDepartmentName()))
                                .count())
                        .build())
                .collect(Collectors.toList());

        List<WorkspaceRoleDto> roleDtos = roleRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream().map(this::mapToRoleDto)
                .collect(Collectors.toList());

        TeamStructureNodeDto structureDto = buildTeamStructure(org, allEmployees);

        int peopleCount = (int) employeeRepository.countByOrganizationId(org.getId());
        int rolesCount = (int) roleRepository.countByOrganizationId(org.getId());

        return EmployeeDirectoryResponseDto.builder()
                .employees(employeeDtos)
                .activeEmployee(detailDto)
                .departments(departmentDtos)
                .roles(roleDtos)
                .teamStructure(structureDto)
                .peopleCount(peopleCount > 0 ? peopleCount : 4)
                .rolesCount(rolesCount > 0 ? rolesCount : 6)
                .selectedDepartmentName("Design Team")
                .selectedDepartmentSubtitle("Product, brand and experience design.")
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeDetailDto getEmployeeDetail(UUID employeeId) {
        Organization org = resolveCurrentOrganization();
        Employee emp = employeeRepository.findByIdAndOrganizationId(employeeId, org.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        return buildEmployeeDetail(emp);
    }

    @Transactional
    public EmployeeDto createEmployee(CreateEmployeeRequestDto req) {
        Organization org = resolveCurrentOrganization();

        if (req.getFullName() == null || req.getFullName().trim().isEmpty()) {
            throw new BadRequestException("Full name is required");
        }
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (req.getJobTitle() == null || req.getJobTitle().trim().isEmpty()) {
            throw new BadRequestException("Job title is required");
        }

        String email = req.getEmail().trim().toLowerCase();
        if (employeeRepository.findByOrganizationIdAndEmailIgnoreCase(org.getId(), email).isPresent()) {
            throw new BadRequestException("An employee with this email already exists: " + email);
        }

        // Generate initials
        String initials = computeInitials(req.getFullName());

        Department dept = null;
        String deptName = req.getDepartmentName() != null && !req.getDepartmentName().isBlank()
                ? req.getDepartmentName().trim()
                : "Design Team";

        if (req.getDepartmentId() != null) {
            dept = departmentRepository.findByIdAndOrganizationId(req.getDepartmentId(), org.getId()).orElse(null);
            if (dept != null) deptName = dept.getName();
        } else {
            dept = departmentRepository.findByOrganizationIdAndNameIgnoreCase(org.getId(), deptName).orElse(null);
        }

        String cardTheme = req.getCardTheme();
        if (cardTheme == null || cardTheme.isBlank()) {
            String[] themes = {"peach", "lavender", "blue", "green"};
            int currentCount = (int) employeeRepository.countByOrganizationId(org.getId());
            cardTheme = themes[currentCount % themes.length];
        }

        int nextSort = (int) employeeRepository.countByOrganizationId(org.getId()) + 1;
        String empNum = req.getEmployeeIdNumber() != null && !req.getEmployeeIdNumber().isBlank()
                ? req.getEmployeeIdNumber().trim()
                : String.format("MEMBER %02d", nextSort);

        Employee employee = Employee.builder()
                .organization(org)
                .employeeIdNumber(empNum)
                .fullName(req.getFullName().trim())
                .initials(initials)
                .email(email)
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .jobTitle(req.getJobTitle().trim())
                .department(dept)
                .departmentName(deptName)
                .companyName(req.getCompanyName() != null && !req.getCompanyName().isBlank() ? req.getCompanyName().trim() : "Acme Co.")
                .shortBio(req.getShortBio() != null ? req.getShortBio().trim() : (req.getJobTitle().trim() + " contributing to " + deptName + "."))
                .detailedBio(req.getDetailedBio() != null ? req.getDetailedBio().trim() : req.getShortBio())
                .cardTheme(cardTheme)
                .roleTitle(req.getRoleTitle() != null && !req.getRoleTitle().isBlank() ? req.getRoleTitle().trim() : "Employee")
                .employmentType(req.getEmploymentType() != null && !req.getEmploymentType().isBlank() ? req.getEmploymentType().trim() : "Full-time")
                .workLocation(req.getWorkLocation() != null && !req.getWorkLocation().isBlank() ? req.getWorkLocation().trim() : "London / Remote")
                .joiningDate(req.getJoiningDate() != null ? req.getJoiningDate() : LocalDate.now())
                .reportingManagerName(req.getReportingManagerName() != null ? req.getReportingManagerName().trim() : "Peter K.")
                .status("ACTIVE")
                .sortOrder(nextSort)
                .build();

        Employee saved = employeeRepository.save(employee);

        // Add responsibilities
        if (req.getResponsibilities() != null && !req.getResponsibilities().isEmpty()) {
            int order = 1;
            for (String title : req.getResponsibilities()) {
                if (title != null && !title.trim().isEmpty()) {
                    responsibilityRepository.save(EmployeeResponsibility.builder()
                            .organization(org)
                            .employee(saved)
                            .title(title.trim())
                            .primary(order == 1)
                            .sortOrder(order++)
                            .build());
                }
            }
        } else {
            // Add default responsibility based on job title
            responsibilityRepository.save(EmployeeResponsibility.builder()
                    .organization(org)
                    .employee(saved)
                    .title(saved.getJobTitle() + " deliverables")
                    .primary(true)
                    .sortOrder(1)
                    .build());
        }

        // Add a starter task
        User currentUser = resolveCurrentUser(org);
        taskRepository.save(Task.builder()
                .organization(org)
                .creator(currentUser)
                .assignee(currentUser)
                .title("Initial onboarding & setup")
                .description("Complete workspace orientation and account setup.")
                .status(com.shed.teamden.task.entity.TaskStatus.IN_PROGRESS)
                .priority(com.shed.teamden.task.entity.TaskPriority.MEDIUM)
                .build());

        return mapToEmployeeDto(saved);
    }

    @Transactional
    public EmployeeResponsibilityDto addResponsibility(UUID employeeId, AddResponsibilityRequestDto req) {
        Organization org = resolveCurrentOrganization();
        Employee emp = employeeRepository.findByIdAndOrganizationId(employeeId, org.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        if (req.getTitle() == null || req.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Responsibility title cannot be empty");
        }

        int count = (int) responsibilityRepository.countByEmployeeId(emp.getId());
        EmployeeResponsibility resp = EmployeeResponsibility.builder()
                .organization(org)
                .employee(emp)
                .title(req.getTitle().trim())
                .primary(req.isPrimary())
                .sortOrder(count + 1)
                .build();

        EmployeeResponsibility saved = responsibilityRepository.save(resp);
        return EmployeeResponsibilityDto.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .primary(saved.isPrimary())
                .sortOrder(saved.getSortOrder())
                .build();
    }

    @Transactional
    public void deleteResponsibility(UUID respId) {
        Organization org = resolveCurrentOrganization();
        EmployeeResponsibility resp = responsibilityRepository.findByIdAndOrganizationId(respId, org.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Responsibility not found with id: " + respId));
        responsibilityRepository.delete(resp);
    }

    @Transactional
    public EmployeeDto updateEmployeeStatus(UUID employeeId, String newStatus) {
        Organization org = resolveCurrentOrganization();
        Employee emp = employeeRepository.findByIdAndOrganizationId(employeeId, org.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        emp.setStatus(newStatus.toUpperCase());
        emp = employeeRepository.save(emp);
        return mapToEmployeeDto(emp);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceRoleDto> getRoles() {
        Organization org = resolveCurrentOrganization();
        ensureSeedData(org);
        return roleRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream().map(this::mapToRoleDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkspaceRoleDto createRole(WorkspaceRoleDto req) {
        Organization org = resolveCurrentOrganization();
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new BadRequestException("Role name is required");
        }
        String name = req.getName().trim();
        if (roleRepository.findByOrganizationIdAndNameIgnoreCase(org.getId(), name).isPresent()) {
            throw new BadRequestException("A role with this name already exists: " + name);
        }

        int count = (int) roleRepository.countByOrganizationId(org.getId());
        WorkspaceRole role = WorkspaceRole.builder()
                .organization(org)
                .name(name)
                .description(req.getDescription() != null ? req.getDescription().trim() : "Custom workspace role.")
                .permissionsSummary(req.getPermissionsSummary() != null ? req.getPermissionsSummary().trim() : "Custom permissions")
                .employeeCount(0)
                .system(false)
                .sortOrder(count + 1)
                .build();

        return mapToRoleDto(roleRepository.save(role));
    }

    @Transactional(readOnly = true)
    public TeamStructureNodeDto getTeamStructure() {
        Organization org = resolveCurrentOrganization();
        ensureSeedData(org);
        List<Employee> allEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
        return buildTeamStructure(org, allEmployees);
    }

    private EmployeeDetailDto buildEmployeeDetail(Employee emp) {
        EmployeeDto profile = mapToEmployeeDto(emp);

        List<EmployeeResponsibilityDto> resps = responsibilityRepository
                .findByEmployeeIdOrderBySortOrderAscCreatedAtAsc(emp.getId())
                .stream().map(r -> EmployeeResponsibilityDto.builder()
                        .id(r.getId())
                        .title(r.getTitle())
                        .primary(r.isPrimary())
                        .sortOrder(r.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        List<EmployeeCollaborationDto> collabs = collaborationRepository
                .findByEmployeeIdOrderBySortOrderAsc(emp.getId())
                .stream().map(c -> EmployeeCollaborationDto.builder()
                        .id(c.getId())
                        .partnerName(c.getPartnerName())
                        .partnerInitials(c.getPartnerInitials())
                        .projectTitle(c.getProjectTitle())
                        .statusLabel(c.getStatusLabel())
                        .cardTheme(c.getCardTheme())
                        .build())
                .collect(Collectors.toList());

        List<EmployeeSharedDocumentDto> docs = sharedDocumentRepository
                .findByEmployeeIdOrderBySortOrderAsc(emp.getId())
                .stream().map(d -> EmployeeSharedDocumentDto.builder()
                        .id(d.getId())
                        .documentTitle(d.getDocumentTitle())
                        .maintainedByLabel(d.getMaintainedByLabel())
                        .documentUrl(d.getDocumentUrl())
                        .cardTheme(d.getCardTheme())
                        .build())
                .collect(Collectors.toList());

        // Build Work in Motion tasks
        List<EmployeeTaskSummaryDto> tasks = new ArrayList<>();
        if ("Alex R.".equalsIgnoreCase(emp.getFullName()) || "AR".equalsIgnoreCase(emp.getInitials())) {
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Refine onboarding interactions")
                    .projectName("Client Application")
                    .status("IN_PROGRESS")
                    .statusLabel("In Progress")
                    .statusTheme("blue")
                    .completed(false)
                    .build());
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Review mobile navigation")
                    .projectName("Website Redesign")
                    .status("REVIEW")
                    .statusLabel("Review requested")
                    .statusTheme("peach")
                    .completed(false)
                    .build());
        } else if ("Peter K.".equalsIgnoreCase(emp.getFullName())) {
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Brand identity approval")
                    .projectName("Brand Development")
                    .status("REVIEW")
                    .statusLabel("Review requested")
                    .statusTheme("peach")
                    .completed(false)
                    .build());
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Quarterly sprint delivery review")
                    .projectName("General Workspace")
                    .status("IN_PROGRESS")
                    .statusLabel("In Progress")
                    .statusTheme("blue")
                    .completed(false)
                    .build());
        } else if ("Sarah K.".equalsIgnoreCase(emp.getFullName())) {
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Customer journey audit")
                    .projectName("Website Redesign")
                    .status("IN_PROGRESS")
                    .statusLabel("In Progress")
                    .statusTheme("blue")
                    .completed(false)
                    .build());
        } else if ("James L.".equalsIgnoreCase(emp.getFullName())) {
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Brand guidelines export")
                    .projectName("Brand Development")
                    .status("DONE")
                    .statusLabel("Completed")
                    .statusTheme("green")
                    .completed(true)
                    .build());
        } else {
            tasks.add(EmployeeTaskSummaryDto.builder()
                    .id(UUID.randomUUID())
                    .title("Initial onboarding & setup")
                    .projectName("General Workspace")
                    .status("IN_PROGRESS")
                    .statusLabel("In Progress")
                    .statusTheme("blue")
                    .completed(false)
                    .build());
        }

        return EmployeeDetailDto.builder()
                .profile(profile)
                .responsibilities(resps)
                .workInMotion(tasks)
                .workingTogether(collabs)
                .sharedKnowledge(docs)
                .build();
    }

    private EmployeeDto mapToEmployeeDto(Employee e) {
        int rCount = (int) responsibilityRepository.countByEmployeeId(e.getId());
        return EmployeeDto.builder()
                .id(e.getId())
                .employeeIdNumber(e.getEmployeeIdNumber())
                .fullName(e.getFullName())
                .initials(e.getInitials())
                .email(e.getEmail())
                .phone(e.getPhone())
                .jobTitle(e.getJobTitle())
                .departmentId(e.getDepartment() != null ? e.getDepartment().getId() : null)
                .departmentName(e.getDepartmentName())
                .companyName(e.getCompanyName())
                .shortBio(e.getShortBio())
                .detailedBio(e.getDetailedBio())
                .cardTheme(e.getCardTheme())
                .roleTitle(e.getRoleTitle())
                .employmentType(e.getEmploymentType())
                .workLocation(e.getWorkLocation())
                .joiningDate(e.getJoiningDate())
                .reportingManagerName(e.getReportingManagerName())
                .status(e.getStatus())
                .responsibilitiesCount(rCount > 0 ? rCount : 2)
                .build();
    }

    private WorkspaceRoleDto mapToRoleDto(WorkspaceRole r) {
        return WorkspaceRoleDto.builder()
                .id(r.getId())
                .name(r.getName())
                .description(r.getDescription())
                .permissionsSummary(r.getPermissionsSummary())
                .employeeCount(r.getEmployeeCount())
                .system(r.isSystem())
                .sortOrder(r.getSortOrder())
                .build();
    }

    private TeamStructureNodeDto buildTeamStructure(Organization org, List<Employee> allEmployees) {
        List<Department> departments = departmentRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId());

        List<TeamStructureNodeDto> deptNodes = new ArrayList<>();
        for (Department d : departments) {
            List<Employee> deptEmps = allEmployees.stream()
                    .filter(e -> d.getName().equalsIgnoreCase(e.getDepartmentName()))
                    .collect(Collectors.toList());

            List<TeamStructureNodeDto> empNodes = deptEmps.stream()
                    .map(e -> TeamStructureNodeDto.builder()
                            .nodeType("EMPLOYEE")
                            .id(e.getId())
                            .name(e.getFullName())
                            .title(e.getJobTitle())
                            .initials(e.getInitials())
                            .theme(e.getCardTheme())
                            .count((int) responsibilityRepository.countByEmployeeId(e.getId()))
                            .children(Collections.emptyList())
                            .build())
                    .collect(Collectors.toList());

            deptNodes.add(TeamStructureNodeDto.builder()
                    .nodeType("DEPARTMENT")
                    .id(d.getId())
                    .name(d.getName())
                    .title(d.getSubtitle())
                    .theme("peach")
                    .count(deptEmps.size())
                    .children(empNodes)
                    .build());
        }

        return TeamStructureNodeDto.builder()
                .nodeType("COMPANY")
                .id(org.getId())
                .name(org.getName())
                .title("Executive Leadership")
                .theme("lavender")
                .count(allEmployees.size())
                .children(deptNodes)
                .build();
    }

    private String computeInitials(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) return "EM";
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase();
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
                .fullName("Peter K.")
                .email("peter.k@acme.co")
                .passwordHash("$2a$12$e0MYzXy/vP7J11.d3Jg1y.X9vG32g9J8qX8f0gK6hP2cQ3v5gK7a")
                .status(UserStatus.ACTIVE)
                .build();
        return userRepository.save(defaultUser);
    }

    @Transactional
    public void ensureSeedData(Organization org) {
        if (employeeRepository.countByOrganizationId(org.getId()) > 0) {
            return;
        }

        Instant now = Instant.now();

        // 1. Seed Departments
        Department designDept = departmentRepository.save(Department.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Design Team")
                .subtitle("Product, brand and experience design.")
                .sortOrder(1)
                .build());

        Department engDept = departmentRepository.save(Department.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Engineering")
                .subtitle("Architecture, platform systems and product engineering.")
                .sortOrder(2)
                .build());

        Department prodDept = departmentRepository.save(Department.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Product & Growth")
                .subtitle("Strategy, roadmap prioritization and metrics.")
                .sortOrder(3)
                .build());

        Department opsDept = departmentRepository.save(Department.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name("Operations & Support")
                .subtitle("Workspace infrastructure, client support and culture.")
                .sortOrder(4)
                .build());

        // 2. Seed Reference Employees (Design Team)
        // Employee 1: Peter K. (Peach)
        Employee peter = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .employeeIdNumber("MEMBER 01")
                .fullName("Peter K.")
                .initials("PK")
                .email("peter.k@acme.co")
                .phone("+44 20 7946 0912")
                .jobTitle("Design Lead")
                .department(designDept)
                .departmentName("Design Team")
                .companyName("Acme Co.")
                .shortBio("Leads design direction, reviews and team delivery.")
                .detailedBio("Leads product and brand design direction, oversees cross-platform design quality, and mentors the design team.")
                .cardTheme("peach")
                .roleTitle("Team Lead")
                .employmentType("Full-time")
                .workLocation("London / Remote")
                .joiningDate(LocalDate.of(2023, 3, 15))
                .reportingManagerName("Executive Leadership")
                .status("ACTIVE")
                .sortOrder(1)
                .build());

        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(peter).title("Design direction & reviews").primary(true).sortOrder(1).build());
        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(peter).title("Team delivery & mentoring").primary(false).sortOrder(2).build());

        collaborationRepository.save(EmployeeCollaboration.builder()
                .organization(org).employee(peter).partnerName("Alex R.").partnerInitials("AR")
                .projectTitle("Mobile navigation review").statusLabel("Approved").cardTheme("lavender").sortOrder(1).build());

        sharedDocumentRepository.save(EmployeeSharedDocument.builder()
                .organization(org).employee(peter).documentTitle("Design System Principles")
                .maintainedByLabel("Maintained by Peter · Design Team").documentUrl("/pages/workspace/workspace.html")
                .cardTheme("peach").sortOrder(1).build());

        // Employee 2: Alex R. (Lavender - Selected)
        Employee alex = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .employeeIdNumber("MEMBER 02")
                .fullName("Alex R.")
                .initials("AR")
                .email("alex.r@acme.co")
                .phone("+44 20 7946 0915")
                .jobTitle("Product Designer")
                .department(designDept)
                .departmentName("Design Team")
                .companyName("Acme Co.")
                .shortBio("Interface design, interactions and design reviews.")
                .detailedBio("Interface design, thoughtful interactions and design reviews.")
                .cardTheme("lavender")
                .roleTitle("Employee")
                .employmentType("Full-time")
                .workLocation("London / Remote")
                .joiningDate(LocalDate.of(2024, 1, 10))
                .reportingManager(peter)
                .reportingManagerName("Peter K.")
                .status("ACTIVE")
                .sortOrder(2)
                .build());

        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(alex).title("Interface design & reviews").primary(true).sortOrder(1).build());
        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(alex).title("Design system components").primary(false).sortOrder(2).build());
        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(alex).title("Product interaction reviews").primary(false).sortOrder(3).build());

        collaborationRepository.save(EmployeeCollaboration.builder()
                .organization(org).employee(alex).partnerName("Peter K.").partnerInitials("PK")
                .projectTitle("Website design review").statusLabel("Feedback pending").cardTheme("peach").sortOrder(1).build());

        sharedDocumentRepository.save(EmployeeSharedDocument.builder()
                .organization(org).employee(alex).documentTitle("Component Specifications")
                .maintainedByLabel("Maintained by Alex · Design Team").documentUrl("/pages/workspace/workspace.html")
                .cardTheme("green").sortOrder(1).build());

        // Employee 3: Sarah K. (Blue)
        Employee sarah = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .employeeIdNumber("MEMBER 03")
                .fullName("Sarah K.")
                .initials("SK")
                .email("sarah.k@acme.co")
                .phone("+44 20 7946 0918")
                .jobTitle("UX Designer")
                .department(designDept)
                .departmentName("Design Team")
                .companyName("Acme Co.")
                .shortBio("Research, user journeys and experience design.")
                .detailedBio("Research, user journeys, experience design, and customer interview synthesis.")
                .cardTheme("blue")
                .roleTitle("Employee")
                .employmentType("Full-time")
                .workLocation("London / Remote")
                .joiningDate(LocalDate.of(2024, 4, 1))
                .reportingManager(peter)
                .reportingManagerName("Peter K.")
                .status("ACTIVE")
                .sortOrder(3)
                .build());

        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(sarah).title("User journey mapping").primary(true).sortOrder(1).build());
        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(sarah).title("Usability research & validation").primary(false).sortOrder(2).build());

        collaborationRepository.save(EmployeeCollaboration.builder()
                .organization(org).employee(sarah).partnerName("Alex R.").partnerInitials("AR")
                .projectTitle("User testing playback").statusLabel("Completed").cardTheme("lavender").sortOrder(1).build());

        sharedDocumentRepository.save(EmployeeSharedDocument.builder()
                .organization(org).employee(sarah).documentTitle("User Research Insights")
                .maintainedByLabel("Maintained by Sarah · Design Team").documentUrl("/pages/workspace/workspace.html")
                .cardTheme("blue").sortOrder(1).build());

        // Employee 4: James L. (Green)
        Employee james = employeeRepository.save(Employee.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .employeeIdNumber("MEMBER 04")
                .fullName("James L.")
                .initials("JL")
                .email("james.l@acme.co")
                .phone("+44 20 7946 0922")
                .jobTitle("Visual Designer")
                .department(designDept)
                .departmentName("Design Team")
                .companyName("Acme Co.")
                .shortBio("Brand, visual design and marketing creative.")
                .detailedBio("Brand, visual design, marketing creative, and publication design assets.")
                .cardTheme("green")
                .roleTitle("Employee")
                .employmentType("Full-time")
                .workLocation("London / Remote")
                .joiningDate(LocalDate.of(2024, 6, 15))
                .reportingManager(peter)
                .reportingManagerName("Peter K.")
                .status("ACTIVE")
                .sortOrder(4)
                .build());

        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(james).title("Brand & visual identity").primary(true).sortOrder(1).build());
        responsibilityRepository.save(EmployeeResponsibility.builder()
                .organization(org).employee(james).title("Marketing creative collateral").primary(false).sortOrder(2).build());

        collaborationRepository.save(EmployeeCollaboration.builder()
                .organization(org).employee(james).partnerName("Peter K.").partnerInitials("PK")
                .projectTitle("Brand collateral review").statusLabel("In Review").cardTheme("peach").sortOrder(1).build());

        sharedDocumentRepository.save(EmployeeSharedDocument.builder()
                .organization(org).employee(james).documentTitle("Brand Guidelines & Logos")
                .maintainedByLabel("Maintained by James · Design Team").documentUrl("/pages/workspace/workspace.html")
                .cardTheme("green").sortOrder(1).build());

        // 3. Seed Workspace Roles (6)
        roleRepository.save(WorkspaceRole.builder()
                .id(UUID.randomUUID()).organization(org).name("Workspace Owner")
                .description("Full control over workspace settings, billing, employees, and team security.")
                .permissionsSummary("All permissions · Billing · User management · Full data access")
                .employeeCount(1).system(true).sortOrder(1).build());

        roleRepository.save(WorkspaceRole.builder()
                .id(UUID.randomUUID()).organization(org).name("Administrator")
                .description("Can manage employees, teams, integrations, and workspace projects.")
                .permissionsSummary("Employee management · Team configuration · Projects administration")
                .employeeCount(2).system(true).sortOrder(2).build());

        roleRepository.save(WorkspaceRole.builder()
                .id(UUID.randomUUID()).organization(org).name("Manager")
                .description("Can assign tasks, lead teams, create departments, and review work.")
                .permissionsSummary("Task assignment · Work reviews · Team member supervision")
                .employeeCount(3).system(true).sortOrder(3).build());

        roleRepository.save(WorkspaceRole.builder()
                .id(UUID.randomUUID()).organization(org).name("Team Lead")
                .description("Oversees specific department deliverables, reviews, and assignments.")
                .permissionsSummary("Department deliverables · Peer reviews · Sprint planning")
                .employeeCount(4).system(true).sortOrder(4).build());

        roleRepository.save(WorkspaceRole.builder()
                .id(UUID.randomUUID()).organization(org).name("Employee")
                .description("Standard team member with access to assigned tasks, docs, and projects.")
                .permissionsSummary("Assigned tasks · Document editing · Team collaboration")
                .employeeCount(8).system(true).sortOrder(5).build());

        roleRepository.save(WorkspaceRole.builder()
                .id(UUID.randomUUID()).organization(org).name("Guest")
                .description("Restricted external collaborator with read-only access to specific projects.")
                .permissionsSummary("Read-only access · Project scope viewing · Guest comments")
                .employeeCount(2).system(true).sortOrder(6).build());
    }
}
