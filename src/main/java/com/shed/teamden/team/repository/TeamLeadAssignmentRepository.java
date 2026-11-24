package com.shed.teamden.team.repository;

import com.shed.teamden.team.entity.TeamLeadAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TeamLeadAssignmentRepository extends JpaRepository<TeamLeadAssignment, UUID> {

    @Query("SELECT tla FROM TeamLeadAssignment tla " +
           "JOIN FETCH tla.leadEmployee " +
           "LEFT JOIN FETCH tla.assignedBy " +
           "WHERE tla.team.id = :teamId " +
           "ORDER BY tla.assignedAt DESC")
    List<TeamLeadAssignment> findByTeamIdWithDetails(@Param("teamId") UUID teamId);

    List<TeamLeadAssignment> findByTeamId(UUID teamId);
}
