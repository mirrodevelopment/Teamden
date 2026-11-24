package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findByOrganizationIdOrderBySortOrderAscCreatedAtAsc(UUID organizationId);
    Optional<Employee> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Employee> findByOrganizationIdAndEmailIgnoreCase(UUID organizationId, String email);
    List<Employee> findByOrganizationIdAndDepartmentIdOrderBySortOrderAsc(UUID organizationId, UUID departmentId);
    long countByOrganizationId(UUID organizationId);
    long countByOrganizationIdAndStatus(UUID organizationId, String status);

    @Query("SELECT e FROM Employee e WHERE e.organization.id = :orgId AND (" +
            "LOWER(e.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(e.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(e.jobTitle) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(e.departmentName) LIKE LOWER(CONCAT('%', :query, '%'))" +
            ") ORDER BY e.sortOrder ASC")
    List<Employee> searchEmployees(@Param("orgId") UUID orgId, @Param("query") String query);
}
