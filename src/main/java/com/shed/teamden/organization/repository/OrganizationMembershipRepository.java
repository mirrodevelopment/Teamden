package com.shed.teamden.organization.repository;

import com.shed.teamden.organization.entity.MembershipStatus;
import com.shed.teamden.organization.entity.OrganizationMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, UUID> {

    @Query("SELECT m FROM OrganizationMembership m JOIN FETCH m.organization WHERE m.user.id = :userId AND m.status = :status")
    List<OrganizationMembership> findActiveMembershipsByUserId(@Param("userId") UUID userId, @Param("status") MembershipStatus status);

    @Query("SELECT m FROM OrganizationMembership m JOIN FETCH m.organization WHERE m.user.id = :userId")
    List<OrganizationMembership> findAllByUserIdWithOrg(@Param("userId") UUID userId);

    @Query("SELECT m FROM OrganizationMembership m JOIN FETCH m.organization WHERE m.organization.id = :orgId AND m.user.id = :userId")
    Optional<OrganizationMembership> findByOrganizationIdAndUserId(@Param("orgId") UUID orgId, @Param("userId") UUID userId);

    long countByOrganizationIdAndStatus(UUID organizationId, MembershipStatus status);
}
