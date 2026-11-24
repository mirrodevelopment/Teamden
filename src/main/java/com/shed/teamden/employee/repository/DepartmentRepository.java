package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    List<Department> findByOrganizationIdOrderBySortOrderAsc(UUID organizationId);
    Optional<Department> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Department> findByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);
    long countByOrganizationId(UUID organizationId);
}
