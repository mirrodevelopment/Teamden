package com.shed.teamden.calendar.repository;

import com.shed.teamden.calendar.entity.CalendarNeedsScheduling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarNeedsSchedulingRepository extends JpaRepository<CalendarNeedsScheduling, UUID> {
    List<CalendarNeedsScheduling> findByOrganizationIdAndIsResolvedFalse(UUID organizationId);
    long countByOrganizationId(UUID organizationId);
}
