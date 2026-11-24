package com.shed.teamden.settings.repository;

import com.shed.teamden.settings.entity.WorkspaceIntegration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceIntegrationRepository extends JpaRepository<WorkspaceIntegration, UUID> {
    List<WorkspaceIntegration> findByOrganizationIdOrderByCodeAsc(UUID organizationId);
    Optional<WorkspaceIntegration> findByOrganizationIdAndCode(UUID organizationId, String code);
}
