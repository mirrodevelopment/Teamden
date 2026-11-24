package com.shed.teamden.settings.repository;

import com.shed.teamden.settings.entity.WorkspaceSetting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface WorkspaceSettingRepository extends JpaRepository<WorkspaceSetting, UUID> {
    Optional<WorkspaceSetting> findByOrganizationId(UUID organizationId);
}
