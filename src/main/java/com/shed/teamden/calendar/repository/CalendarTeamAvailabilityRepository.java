package com.shed.teamden.calendar.repository;

import com.shed.teamden.calendar.entity.CalendarTeamAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CalendarTeamAvailabilityRepository extends JpaRepository<CalendarTeamAvailability, UUID> {
    List<CalendarTeamAvailability> findByOrganizationIdOrderByDisplayOrderAsc(UUID organizationId);
    long countByOrganizationId(UUID organizationId);
}
