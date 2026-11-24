package com.shed.teamden.team.repository;

import com.shed.teamden.team.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {

    @Query("SELECT t FROM Team t " +
           "LEFT JOIN FETCH t.department " +
           "LEFT JOIN FETCH t.teamLead " +
           "LEFT JOIN FETCH t.assistantTeamLead " +
           "LEFT JOIN FETCH t.reportingManager " +
           "WHERE t.organization.id = :orgId " +
           "ORDER BY t.createdAt DESC")
    List<Team> findByOrganizationIdWithDetails(@Param("orgId") UUID orgId);

    List<Team> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);

    Optional<Team> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);

    boolean existsByOrganizationIdAndCodeIgnoreCase(UUID organizationId, String code);

    long countByOrganizationId(UUID organizationId);
}
