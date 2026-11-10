package com.shed.teamden.calendar.repository;

import com.shed.teamden.calendar.entity.CalendarSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarSourceRepository extends JpaRepository<CalendarSource, UUID> {
    List<CalendarSource> findByOrganizationId(UUID organizationId);
    long countByOrganizationId(UUID organizationId);
}
