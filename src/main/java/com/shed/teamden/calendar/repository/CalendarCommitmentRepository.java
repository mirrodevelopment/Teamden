package com.shed.teamden.calendar.repository;

import com.shed.teamden.calendar.entity.CalendarCommitment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CalendarCommitmentRepository extends JpaRepository<CalendarCommitment, UUID> {
    List<CalendarCommitment> findByOrganizationIdOrderByDisplayOrderAsc(UUID organizationId);
    long countByOrganizationId(UUID organizationId);
}
