package com.shed.teamden.calendar.repository;

import com.shed.teamden.calendar.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    List<CalendarEvent> findByOrganizationIdOrderByEventDateAscStartTimeAsc(UUID organizationId);

    List<CalendarEvent> findByOrganizationIdAndEventDateBetweenOrderByEventDateAscStartTimeAsc(
            UUID organizationId, LocalDate startDate, LocalDate endDate);

    Optional<CalendarEvent> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);
}
