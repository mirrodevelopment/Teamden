package com.shed.teamden.activity.repository;

import com.shed.teamden.activity.entity.ActivityEvent;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {

    @Query("SELECT e FROM ActivityEvent e LEFT JOIN FETCH e.actor WHERE e.organization.id = :orgId ORDER BY e.eventTimestamp DESC")
    List<ActivityEvent> findRecentByOrganizationId(@Param("orgId") UUID orgId, Pageable pageable);
}
