package com.shed.teamden.organization.repository;

import com.shed.teamden.organization.entity.OrganizationAddress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationAddressRepository extends JpaRepository<OrganizationAddress, UUID> {
    Optional<OrganizationAddress> findByOrganizationId(UUID organizationId);
}
