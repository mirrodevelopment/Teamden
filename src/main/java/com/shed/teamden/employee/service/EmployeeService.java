package com.shed.teamden.employee.service;

import com.shed.teamden.common.exception.BadRequestException;
import com.shed.teamden.common.exception.ResourceNotFoundException;
import com.shed.teamden.common.exception.UnauthorizedException;
import com.shed.teamden.employee.dto.AddResponsibilityRequestDto;
import com.shed.teamden.employee.dto.CreateDepartmentRequestDto;
import com.shed.teamden.employee.dto.CreateEmployeeRequestDto;
import com.shed.teamden.employee.dto.DepartmentDto;
import com.shed.teamden.employee.dto.EmployeeCollaborationDto;
import com.shed.teamden.employee.dto.EmployeeDetailDto;
import com.shed.teamden.employee.dto.EmployeeDirectoryResponseDto;
import com.shed.teamden.employee.dto.EmployeeDto;
import com.shed.teamden.employee.dto.EmployeeResponsibilityDto;
import com.shed.teamden.employee.dto.EmployeeSharedDocumentDto;
import com.shed.teamden.employee.dto.EmployeeTaskSummaryDto;
import com.shed.teamden.employee.dto.TeamStructureNodeDto;
import com.shed.teamden.employee.dto.WorkspaceRoleDto;
import com.shed.teamden.employee.entity.Department;
import com.shed.teamden.employee.entity.Employee;
import com.shed.teamden.employee.entity.EmployeeResponsibility;
import com.shed.teamden.employee.entity.WorkspaceRole;
import com.shed.teamden.employee.repository.DepartmentRepository;
import com.shed.teamden.employee.repository.EmployeeCollaborationRepository;
import com.shed.teamden.employee.repository.EmployeeRepository;
import com.shed.teamden.employee.repository.EmployeeResponsibilityRepository;
import com.shed.teamden.employee.repository.EmployeeSharedDocumentRepository;
import com.shed.teamden.employee.repository.WorkspaceRoleRepository;
import com.shed.teamden.organization.entity.Organization;
import com.shed.teamden.organization.repository.OrganizationRepository;
import com.shed.teamden.security.CustomUserDetails;
import com.shed.teamden.security.SecurityUtils;
import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskPriority;
import com.shed.teamden.task.entity.TaskStatus;
import com.shed.teamden.task.repository.TaskRepository;
import com.shed.teamden.user.entity.User;
import com.shed.teamden.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class EmployeeService {

    private static final String THEME_PEACH = "peach";
    private static final String DEFAULT_DEPARTMENT_NAME = "Design Team";
    private static final String ERR_EMPLOYEE_NOT_FOUND = "Employee not found with id: ";
    private static final List<String> CARD_THEMES = List.of(THEME_PEACH, "lavender", "blue", "green");

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeResponsibilityRepository responsibilityRepository;
    private final WorkspaceRoleRepository roleRepository;
    private final EmployeeCollaborationRepository collaborationRepository;
    private final EmployeeSharedDocumentRepository sharedDocumentRepository;
    private final TaskRepository taskRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;

    private record ResolvedDepartment(Department entity, String name) {}

    @Transactional(readOnly = true)
    public EmployeeDirectoryResponseDto getDirectory(String search, String departmentFilter, String roleFilter, UUID activeId) {
        Organization org = resolveCurrentOrganization();

        List<Employee> allEmployees;
        if (search != null && !search.isBlank()) {
            allEmployees = employeeRepository.searchEmployees(org.getId(), search.trim());
        } else {
            allEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
        }

        // Filter by department if requested
        if (departmentFilter != null && !departmentFilter.isBlank() && !"all".equalsIgnoreCase(departmentFilter.trim())) {
            String targetDept = departmentFilter.trim();
            allEmployees = allEmployees.stream()
                    .filter(e -> targetDept.equalsIgnoreCase(e.getDepartmentName()) ||
                            (e.getDepartment() != null && targetDept.equalsIgnoreCase(e.getDepartment().getName())))
                    .toList();
        }

        // Filter by role if requested
        if (roleFilter != null && !roleFilter.isBlank() && !"all".equalsIgnoreCase(roleFilter.trim())) {
            String targetRole = roleFilter.trim();
            allEmployees = allEmployees.stream()
                    .filter(e -> targetRole.equalsIgnoreCase(e.getRoleTitle()))
                    .toList();
        }

        List<EmployeeDto> employeeDtos = allEmployees.stream()
                .map(this::mapToEmployeeDto)
                .toList();

        // Resolve active employee detail
        Employee activeEmployee = null;
        if (activeId != null) {
            activeEmployee = allEmployees.stream()
                    .filter(e -> Objects.equals(e.getId(), activeId))
                    .findFirst()
                    .orElse(null);
        }
        if (activeEmployee == null) {
            activeEmployee = allEmployees.isEmpty() ? null : allEmployees.get(0);
        }

        EmployeeDetailDto detailDto = activeEmployee != null ? buildEmployeeDetail(activeEmployee) : null;

        final List<Employee> finalEmployees = allEmployees;
        List<DepartmentDto> departmentDtos = departmentRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream()
                .map(d -> DepartmentDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .subtitle(d.getSubtitle())
                        .memberCount((int) finalEmployees.stream()
                                .filter(e -> d.getName().equalsIgnoreCase(e.getDepartmentName()))
                                .count())
                        .build())
                .toList();

        List<WorkspaceRoleDto> roleDtos = roleRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream()
                .map(this::mapToRoleDto)
                .toList();

        TeamStructureNodeDto structureDto = buildTeamStructure(org, allEmployees);

        int peopleCount = (int) employeeRepository.countByOrganizationId(org.getId());
        int rolesCount = (int) roleRepository.countByOrganizationId(org.getId());

        return EmployeeDirectoryResponseDto.builder()
                .employees(employeeDtos)
                .activeEmployee(detailDto)
                .departments(departmentDtos)
                .roles(roleDtos)
                .teamStructure(structureDto)
                .peopleCount(peopleCount)
                .rolesCount(rolesCount)
                .selectedDepartmentName(DEFAULT_DEPARTMENT_NAME)
                .selectedDepartmentSubtitle("Product, brand and experience design.")
                .build();
    }

    @Transactional(readOnly = true)
    public EmployeeDetailDto getEmployeeDetail(UUID employeeId) {
        Organization org = resolveCurrentOrganization();
        Employee emp = findEmployeeOrThrow(employeeId, org.getId());
        return buildEmployeeDetail(emp);
    }

    @Transactional
    public EmployeeDto createEmployee(CreateEmployeeRequestDto req) {
        Organization org = resolveCurrentOrganization();
        validateCreateRequest(req, org.getId());

        ResolvedDepartment dept = resolveDepartment(org, req);
        int currentCount = (int) employeeRepository.countByOrganizationId(org.getId());
        Employee employee = buildNewEmployee(org, req, dept, currentCount);
        Employee saved = employeeRepository.save(employee);

        saveResponsibilities(org, saved, req.getResponsibilities());
        createStarterTask(org, resolveCurrentUser());

        return mapToEmployeeDto(saved);
    }

    private void validateCreateRequest(CreateEmployeeRequestDto req, UUID orgId) {
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new BadRequestException("Full name is required");
        }
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (req.getJobTitle() == null || req.getJobTitle().isBlank()) {
            throw new BadRequestException("Job title is required");
        }

        String email = req.getEmail().trim().toLowerCase(Locale.ROOT);
        if (employeeRepository.findByOrganizationIdAndEmailIgnoreCase(orgId, email).isPresent()) {
            throw new BadRequestException("An employee with this email already exists: " + email);
        }
    }

    private ResolvedDepartment resolveDepartment(Organization org, CreateEmployeeRequestDto req) {
        String deptName = req.getDepartmentName() != null && !req.getDepartmentName().isBlank()
                ? req.getDepartmentName().trim()
                : DEFAULT_DEPARTMENT_NAME;

        if (req.getDepartmentId() != null) {
            Department dept = departmentRepository.findByIdAndOrganizationId(req.getDepartmentId(), org.getId()).orElse(null);
            return new ResolvedDepartment(dept, dept != null ? dept.getName() : deptName);
        }

        Department dept = departmentRepository.findByOrganizationIdAndNameIgnoreCase(org.getId(), deptName).orElse(null);
        return new ResolvedDepartment(dept, deptName);
    }

    private Employee buildNewEmployee(Organization org, CreateEmployeeRequestDto req, ResolvedDepartment dept, int currentCount) {
        String cardTheme = req.getCardTheme();
        if (cardTheme == null || cardTheme.isBlank()) {
            cardTheme = CARD_THEMES.get(currentCount % CARD_THEMES.size());
        }

        int nextSort = currentCount + 1;
        String empNum = req.getEmployeeIdNumber() != null && !req.getEmployeeIdNumber().isBlank()
                ? req.getEmployeeIdNumber().trim()
                : String.format("MEMBER %02d", nextSort);

        String trimmedJobTitle = req.getJobTitle().trim();
        String shortBio = req.getShortBio() != null && !req.getShortBio().isBlank()
                ? req.getShortBio().trim()
                : trimmedJobTitle + " contributing to " + dept.name() + ".";
        String detailedBio = req.getDetailedBio() != null && !req.getDetailedBio().isBlank()
                ? req.getDetailedBio().trim()
                : shortBio;

        return Employee.builder()
                .organization(org)
                .employeeIdNumber(empNum)
                .fullName(req.getFullName().trim())
                .initials(computeInitials(req.getFullName()))
                .email(req.getEmail().trim().toLowerCase(Locale.ROOT))
                .phone(cleanString(req.getPhone()))
                .jobTitle(trimmedJobTitle)
                .department(dept.entity())
                .departmentName(dept.name())
                .companyName(defaultIfBlank(req.getCompanyName(), org.getName()))
                .shortBio(shortBio)
                .detailedBio(detailedBio)
                .cardTheme(cardTheme)
                .roleTitle(defaultIfBlank(req.getRoleTitle(), "Employee"))
                .employmentType(defaultIfBlank(req.getEmploymentType(), "Full-time"))
                .workLocation(defaultIfBlank(req.getWorkLocation(), "Remote"))
                .joiningDate(req.getJoiningDate() != null ? req.getJoiningDate() : LocalDate.now(ZoneId.systemDefault()))
                .reportingManagerName(cleanString(req.getReportingManagerName()))
                .status("ACTIVE")
                .sortOrder(nextSort)
                .build();
    }

    private void saveResponsibilities(Organization org, Employee employee, List<String> responsibilities) {
        if (responsibilities != null && !responsibilities.isEmpty()) {
            int order = 1;
            for (String title : responsibilities) {
                if (title != null && !title.isBlank()) {
                    responsibilityRepository.save(EmployeeResponsibility.builder()
                            .organization(org)
                            .employee(employee)
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
                    .employee(employee)
                    .title(employee.getJobTitle() + " deliverables")
                    .primary(true)
                    .sortOrder(1)
                    .build());
        }
    }

    private void createStarterTask(Organization org, User user) {
        taskRepository.save(Task.builder()
                .organization(org)
                .creator(user)
                .assignee(user)
                .title("Initial onboarding & setup")
                .description("Complete workspace orientation and account setup.")
                .status(TaskStatus.IN_PROGRESS)
                .priority(TaskPriority.MEDIUM)
                .build());
    }

    private static String cleanString(String val) {
        return val != null && !val.isBlank() ? val.trim() : null;
    }

    private static String defaultIfBlank(String val, String defaultValue) {
        return val != null && !val.isBlank() ? val.trim() : defaultValue;
    }

    @Transactional
    public EmployeeResponsibilityDto addResponsibility(UUID employeeId, AddResponsibilityRequestDto req) {
        Organization org = resolveCurrentOrganization();
        Employee emp = findEmployeeOrThrow(employeeId, org.getId());

        if (req.getTitle() == null || req.getTitle().isBlank()) {
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
        Employee emp = findEmployeeOrThrow(employeeId, org.getId());

        if (newStatus == null || newStatus.isBlank()) {
            throw new BadRequestException("Status is required");
        }

        emp.setStatus(newStatus.trim().toUpperCase(Locale.ROOT));
        emp = employeeRepository.save(emp);
        return mapToEmployeeDto(emp);
    }

    @Transactional(readOnly = true)
    public List<WorkspaceRoleDto> getRoles() {
        Organization org = resolveCurrentOrganization();
        return roleRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream()
                .map(this::mapToRoleDto)
                .toList();
    }

    @Transactional
    public WorkspaceRoleDto createRole(WorkspaceRoleDto req) {
        Organization org = resolveCurrentOrganization();
        if (req.getName() == null || req.getName().isBlank()) {
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
                .description(req.getDescription() != null && !req.getDescription().isBlank() ? req.getDescription().trim() : "Custom workspace role.")
                .permissionsSummary(req.getPermissionsSummary() != null && !req.getPermissionsSummary().isBlank() ? req.getPermissionsSummary().trim() : "Custom permissions")
                .employeeCount(0)
                .system(false)
                .sortOrder(count + 1)
                .build();

        return mapToRoleDto(roleRepository.save(role));
    }

    @Transactional(readOnly = true)
    public TeamStructureNodeDto getTeamStructure() {
        Organization org = resolveCurrentOrganization();
        List<Employee> allEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
        return buildTeamStructure(org, allEmployees);
    }

    private EmployeeDetailDto buildEmployeeDetail(Employee emp) {
        EmployeeDto profile = mapToEmployeeDto(emp);

        List<EmployeeResponsibilityDto> resps = responsibilityRepository
                .findByEmployeeIdOrderBySortOrderAscCreatedAtAsc(emp.getId())
                .stream()
                .map(r -> EmployeeResponsibilityDto.builder()
                        .id(r.getId())
                        .title(r.getTitle())
                        .primary(r.isPrimary())
                        .sortOrder(r.getSortOrder())
                        .build())
                .toList();

        List<EmployeeCollaborationDto> collabs = collaborationRepository
                .findByEmployeeIdOrderBySortOrderAsc(emp.getId())
                .stream()
                .map(c -> EmployeeCollaborationDto.builder()
                        .id(c.getId())
                        .partnerName(c.getPartnerName())
                        .partnerInitials(c.getPartnerInitials())
                        .projectTitle(c.getProjectTitle())
                        .statusLabel(c.getStatusLabel())
                        .cardTheme(c.getCardTheme())
                        .build())
                .toList();

        List<EmployeeSharedDocumentDto> docs = sharedDocumentRepository
                .findByEmployeeIdOrderBySortOrderAsc(emp.getId())
                .stream()
                .map(d -> EmployeeSharedDocumentDto.builder()
                        .id(d.getId())
                        .documentTitle(d.getDocumentTitle())
                        .maintainedByLabel(d.getMaintainedByLabel())
                        .documentUrl(d.getDocumentUrl())
                        .cardTheme(d.getCardTheme())
                        .build())
                .toList();

        List<EmployeeTaskSummaryDto> tasks = resolveEmployeeTasks(emp);

        return EmployeeDetailDto.builder()
                .profile(profile)
                .responsibilities(resps)
                .workInMotion(tasks)
                .workingTogether(collabs)
                .sharedKnowledge(docs)
                .build();
    }

    private List<EmployeeTaskSummaryDto> resolveEmployeeTasks(Employee emp) {
        if (emp.getUser() == null) {
            return Collections.emptyList();
        }
        List<Task> assignedTasks = taskRepository.findByOrganizationIdAndAssigneeId(
                emp.getOrganization().getId(), emp.getUser().getId(), PageRequest.of(0, 10));
        return assignedTasks.stream()
                .map(this::mapToTaskSummaryDto)
                .toList();
    }

    private EmployeeTaskSummaryDto mapToTaskSummaryDto(Task t) {
        TaskStatus status = t.getStatus();
        String statusName = status != null ? status.name() : "IN_PROGRESS";
        String statusLabel = statusName.replace('_', ' ');
        String statusTheme = resolveTaskStatusTheme(status);
        String projectName = t.getProject() != null ? t.getProject().getName() : "General Workspace";

        return EmployeeTaskSummaryDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .projectName(projectName)
                .status(statusName)
                .statusLabel(statusLabel)
                .statusTheme(statusTheme)
                .completed(status == TaskStatus.COMPLETED)
                .build();
    }

    private String resolveTaskStatusTheme(TaskStatus status) {
        if (status == TaskStatus.COMPLETED) {
            return "green";
        }
        if (status == TaskStatus.IN_REVIEW) {
            return THEME_PEACH;
        }
        return "blue";
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
                    .toList();

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
                    .toList();

            deptNodes.add(TeamStructureNodeDto.builder()
                    .nodeType("DEPARTMENT")
                    .id(d.getId())
                    .name(d.getName())
                    .title(d.getSubtitle())
                    .theme(THEME_PEACH)
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
        if (fullName == null || fullName.isBlank()) {
            return "EM";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, Math.min(2, parts[0].length())).toUpperCase(Locale.ROOT);
        }
        return (parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)).toUpperCase(Locale.ROOT);
    }

    private Employee findEmployeeOrThrow(UUID employeeId, UUID orgId) {
        return employeeRepository.findByIdAndOrganizationId(employeeId, orgId)
                .orElseThrow(() -> new ResourceNotFoundException(ERR_EMPLOYEE_NOT_FOUND + employeeId));
    }

    @Transactional(readOnly = true)
    public List<DepartmentDto> getDepartments() {
        Organization org = resolveCurrentOrganization();
        List<Employee> allEmployees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
        return departmentRepository.findByOrganizationIdOrderBySortOrderAsc(org.getId())
                .stream()
                .map(d -> {
                    String headName = d.getDepartmentHead() != null ? d.getDepartmentHead().getFullName() : null;
                    String headInitials = headName != null ? computeInitials(headName) : null;
                    int count = (int) allEmployees.stream()
                            .filter(e -> (e.getDepartment() != null && e.getDepartment().getId().equals(d.getId()))
                                    || d.getName().equalsIgnoreCase(e.getDepartmentName()))
                            .count();
                    return DepartmentDto.builder()
                            .id(d.getId())
                            .name(d.getName())
                            .subtitle(d.getSubtitle())
                            .memberCount(count)
                            .headName(headName)
                            .headInitials(headInitials)
                            .build();
                })
                .toList();
    }

    @Transactional
    public DepartmentDto createDepartment(CreateDepartmentRequestDto req) {
        if (req == null || req.getName() == null || req.getName().isBlank()) {
            throw new BadRequestException("Team name is required");
        }

        Organization org = resolveCurrentOrganization();

        String trimmedName = req.getName().trim();
        if (departmentRepository.findByOrganizationIdAndNameIgnoreCase(org.getId(), trimmedName).isPresent()) {
            throw new BadRequestException("A team with name '" + trimmedName + "' already exists");
        }

        User deptHead = null;
        if (req.getDepartmentHeadId() != null) {
            deptHead = userRepository.findById(req.getDepartmentHeadId()).orElse(null);
            if (deptHead == null) {
                Employee emp = employeeRepository.findById(req.getDepartmentHeadId()).orElse(null);
                if (emp != null && emp.getUser() != null) {
                    deptHead = emp.getUser();
                }
            }
        }

        long count = departmentRepository.countByOrganizationId(org.getId());

        Department dept = Department.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .name(trimmedName)
                .subtitle(req.getSubtitle() != null && !req.getSubtitle().isBlank() ? req.getSubtitle().trim() : null)
                .departmentHead(deptHead)
                .sortOrder((int) count)
                .build();

        dept = departmentRepository.save(dept);

        int memberCount = 0;
        if (req.getMemberIds() != null && !req.getMemberIds().isEmpty()) {
            List<Employee> employees = employeeRepository.findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(org.getId());
            for (Employee emp : employees) {
                if (req.getMemberIds().contains(emp.getId())
                        || (emp.getUser() != null && req.getMemberIds().contains(emp.getUser().getId()))) {
                    emp.setDepartment(dept);
                    emp.setDepartmentName(dept.getName());
                    employeeRepository.save(emp);
                    memberCount++;
                }
            }
        }

        String headName = dept.getDepartmentHead() != null ? dept.getDepartmentHead().getFullName() : null;
        String headInitials = headName != null ? computeInitials(headName) : null;

        return DepartmentDto.builder()
                .id(dept.getId())
                .name(dept.getName())
                .subtitle(dept.getSubtitle())
                .memberCount(memberCount)
                .headName(headName)
                .headInitials(headInitials)
                .build();
    }

    private Organization resolveCurrentOrganization() {
        Optional<CustomUserDetails> userOpt = SecurityUtils.getAuthenticatedUser();
        if (userOpt.isPresent()) {
            CustomUserDetails userDetails = userOpt.get();
            if (userDetails.getActiveOrganizationId() != null) {
                return organizationRepository.findById(userDetails.getActiveOrganizationId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Active organization not found: " + userDetails.getActiveOrganizationId()));
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
            CustomUserDetails userDetails = userOpt.get();
            return userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getId()));
        }
        List<User> users = userRepository.findAll();
        if (!users.isEmpty()) {
            return users.get(0);
        }
        throw new UnauthorizedException("Authentication required. No active user found.");
    }
}
