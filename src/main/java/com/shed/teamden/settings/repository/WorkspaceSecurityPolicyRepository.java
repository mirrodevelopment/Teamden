package com.shed.teamden.settings.repository;

import com.shed.teamden.settings.entity.WorkspaceSecurityPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkspaceSecurityPolicyRepository extends JpaRepository<WorkspaceSecurityPolicy, UUID> {
    List<WorkspaceSecurityPolicy> findByOrganizationId(UUID organizationId);
    Optional<WorkspaceSecurityPolicy> findByOrganizationIdAndPolicyKey(UUID organizationId, String policyKey);
}
