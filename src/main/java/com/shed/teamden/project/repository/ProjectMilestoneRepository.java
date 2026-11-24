package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.ProjectMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, UUID> {

    @Query("SELECT m FROM ProjectMilestone m LEFT JOIN FETCH m.project WHERE m.organization.id = :organizationId ORDER BY m.dueDate ASC NULLS LAST")
    List<ProjectMilestone> findByOrganizationIdOrderByDueDateAsc(@Param("organizationId") UUID organizationId);

    List<ProjectMilestone> findByProjectIdOrderBySeqNumAsc(UUID projectId);

    List<ProjectMilestone> findByOrganizationIdAndProjectIdOrderBySeqNumAsc(UUID organizationId, UUID projectId);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, MilestoneStatus status);
}
