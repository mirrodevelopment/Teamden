package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.EmployeeResponsibility;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmployeeResponsibilityRepository extends JpaRepository<EmployeeResponsibility, UUID> {
    List<EmployeeResponsibility> findByEmployeeIdOrderBySortOrderAscCreatedAtAsc(UUID employeeId);
    Optional<EmployeeResponsibility> findByIdAndOrganizationId(UUID id, UUID organizationId);
    long countByEmployeeId(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
