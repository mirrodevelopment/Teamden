package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.DecisionStatus;
import com.shed.teamden.project.entity.ProjectDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectDecisionRepository extends JpaRepository<ProjectDecision, UUID> {

    @Query("SELECT d FROM ProjectDecision d LEFT JOIN FETCH d.decider WHERE d.project.id = :projectId ORDER BY d.dueDate ASC NULLS LAST, d.createdAt DESC")
    List<ProjectDecision> findByProjectIdWithDecider(@Param("projectId") UUID projectId);

    List<ProjectDecision> findByOrganizationIdAndProjectIdOrderByDueDateAsc(UUID organizationId, UUID projectId);

    long countByProjectIdAndStatus(UUID projectId, DecisionStatus status);
}
