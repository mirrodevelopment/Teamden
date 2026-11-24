package com.shed.teamden.inbox.repository;

import com.shed.teamden.inbox.entity.InboxPreference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InboxPreferenceRepository extends JpaRepository<InboxPreference, UUID> {
    Optional<InboxPreference> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);
    void deleteByOrganizationId(UUID organizationId);
}
