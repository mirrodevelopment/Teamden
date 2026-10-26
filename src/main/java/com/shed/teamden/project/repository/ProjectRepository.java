package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.Project;
import com.shed.teamden.project.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.owner WHERE p.organization.id = :orgId ORDER BY p.createdAt DESC")
    List<Project> findByOrganizationIdWithDetails(@Param("orgId") UUID orgId);

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.owner WHERE p.organization.id = :orgId AND p.id = :projectId")
    Optional<Project> findByOrganizationIdAndId(@Param("orgId") UUID orgId, @Param("projectId") UUID projectId);

    long countByOrganizationIdAndStatus(UUID orgId, ProjectStatus status);

    long countByOrganizationIdAndStatusIn(UUID orgId, Collection<ProjectStatus> statuses);
}
