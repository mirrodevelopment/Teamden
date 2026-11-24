package com.shed.teamden.organization.repository;

import com.shed.teamden.organization.entity.LegalAcceptance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LegalAcceptanceRepository extends JpaRepository<LegalAcceptance, UUID> {
    List<LegalAcceptance> findByOrganizationId(UUID organizationId);
    List<LegalAcceptance> findByUserId(UUID userId);
}
