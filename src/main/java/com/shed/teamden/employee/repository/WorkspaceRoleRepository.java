package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.WorkspaceRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WorkspaceRoleRepository extends JpaRepository<WorkspaceRole, UUID> {
    List<WorkspaceRole> findByOrganizationIdOrderBySortOrderAsc(UUID organizationId);
    Optional<WorkspaceRole> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<WorkspaceRole> findByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);
    long countByOrganizationId(UUID organizationId);
}
