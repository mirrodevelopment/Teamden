package com.shed.teamden.team.repository;

import com.shed.teamden.team.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {

    @Query("SELECT tm FROM TeamMember tm " +
           "JOIN FETCH tm.employee e " +
           "LEFT JOIN FETCH e.department " +
           "WHERE tm.team.id = :teamId " +
           "ORDER BY tm.joinedDate ASC, tm.createdAt ASC")
    List<TeamMember> findByTeamIdWithEmployee(@Param("teamId") UUID teamId);

    List<TeamMember> findByTeamId(UUID teamId);

    List<TeamMember> findByOrganizationIdAndEmployeeId(UUID organizationId, UUID employeeId);

    Optional<TeamMember> findByTeamIdAndEmployeeId(UUID teamId, UUID employeeId);

    long countByTeamId(UUID teamId);
}
