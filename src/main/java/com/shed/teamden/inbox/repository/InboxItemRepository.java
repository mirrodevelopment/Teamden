package com.shed.teamden.inbox.repository;

import com.shed.teamden.inbox.entity.InboxItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InboxItemRepository extends JpaRepository<InboxItem, UUID> {

    @Query("SELECT i FROM InboxItem i " +
           "WHERE i.organization.id = :orgId AND (i.user.id = :userId OR i.user IS NULL) " +
           "ORDER BY i.sortOrder ASC, i.createdAt DESC")
    List<InboxItem> findUserInboxItems(@Param("orgId") UUID orgId, @Param("userId") UUID userId);

    List<InboxItem> findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(UUID organizationId);

    Optional<InboxItem> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("SELECT i FROM InboxItem i " +
           "WHERE i.organization.id = :orgId AND (i.user.id = :userId OR i.user IS NULL) AND i.isRead = false AND i.isArchived = false")
    List<InboxItem> findUnreadUserInboxItems(@Param("orgId") UUID orgId, @Param("userId") UUID userId);

    void deleteByOrganizationId(UUID organizationId);

    void deleteByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
