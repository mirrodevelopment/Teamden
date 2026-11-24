package com.shed.teamden.organization.repository;

import com.shed.teamden.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    @Override
    long count();
    Optional<Organization> findByName(String name);
}
