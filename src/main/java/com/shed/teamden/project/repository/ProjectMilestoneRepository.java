package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.MilestoneStatus;
import com.shed.teamden.project.entity.ProjectMilestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, UUID> {

    List<ProjectMilestone> findByProjectIdOrderBySeqNumAsc(UUID projectId);

    List<ProjectMilestone> findByOrganizationIdAndProjectIdOrderBySeqNumAsc(UUID organizationId, UUID projectId);

    long countByProjectId(UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, MilestoneStatus status);
}
