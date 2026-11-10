package com.shed.teamden.calendar.repository;

import com.shed.teamden.calendar.entity.CalendarTeamAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarTeamAvailabilityRepository extends JpaRepository<CalendarTeamAvailability, UUID> {
    List<CalendarTeamAvailability> findByOrganizationIdOrderByDisplayOrderAsc(UUID organizationId);
    long countByOrganizationId(UUID organizationId);
}
