package com.shed.teamden.settings.repository;

import com.shed.teamden.settings.entity.WorkspaceRolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceRolePermissionRepository extends JpaRepository<WorkspaceRolePermission, UUID> {

    List<WorkspaceRolePermission> findByOrganizationIdOrderBySortOrderAscRoleCodeAscModuleNameAsc(UUID organizationId);

    List<WorkspaceRolePermission> findByOrganizationIdAndRoleCode(UUID organizationId, String roleCode);

    Optional<WorkspaceRolePermission> findByOrganizationIdAndRoleCodeAndModuleName(UUID organizationId, String roleCode, String moduleName);

    long countByOrganizationId(UUID organizationId);
}
