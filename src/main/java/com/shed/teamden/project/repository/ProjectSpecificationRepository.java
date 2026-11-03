package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.ProjectSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectSpecificationRepository extends JpaRepository<ProjectSpecification, UUID> {

    Optional<ProjectSpecification> findByProjectId(UUID projectId);

    Optional<ProjectSpecification> findByOrganizationIdAndProjectId(UUID organizationId, UUID projectId);
}
