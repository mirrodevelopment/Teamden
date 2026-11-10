package com.shed.teamden.activity.repository;

import com.shed.teamden.activity.entity.ActivityEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {

    @Query("SELECT e FROM ActivityEvent e LEFT JOIN FETCH e.actor WHERE e.organization.id = :orgId ORDER BY e.eventTimestamp DESC")
    List<ActivityEvent> findRecentByOrganizationId(@Param("orgId") UUID orgId, Pageable pageable);

    @Query("SELECT e FROM ActivityEvent e LEFT JOIN FETCH e.actor WHERE e.project.id = :projectId ORDER BY e.eventTimestamp DESC")
    List<ActivityEvent> findRecentByProjectId(@Param("projectId") UUID projectId, Pageable pageable);

    @Query("SELECT e FROM ActivityEvent e LEFT JOIN FETCH e.actor LEFT JOIN FETCH e.project WHERE e.organization.id = :orgId ORDER BY e.eventTimestamp DESC")
    List<ActivityEvent> findAllByOrganizationIdWithDetails(@Param("orgId") UUID orgId);

    @Query("SELECT e FROM ActivityEvent e LEFT JOIN FETCH e.actor LEFT JOIN FETCH e.project WHERE e.organization.id = :orgId AND e.eventTimestamp >= :start AND e.eventTimestamp < :end ORDER BY e.eventTimestamp DESC")
    List<ActivityEvent> findFilteredByOrganizationId(@Param("orgId") UUID orgId, @Param("start") Instant start, @Param("end") Instant end);
}
