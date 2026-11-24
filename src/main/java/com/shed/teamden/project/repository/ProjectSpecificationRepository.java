package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.ProjectSpecification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProjectSpecificationRepository extends JpaRepository<ProjectSpecification, UUID> {

    Optional<ProjectSpecification> findByProjectId(UUID projectId);

    Optional<ProjectSpecification> findByOrganizationIdAndProjectId(UUID organizationId, UUID projectId);
}
