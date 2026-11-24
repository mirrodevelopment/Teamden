package com.shed.teamden.notification.repository;

import com.shed.teamden.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByOrganizationIdOrderBySortOrderAscCreatedAtDesc(UUID organizationId);

    List<Notification> findByOrganizationIdAndIsArchivedFalseOrderBySortOrderAscCreatedAtDesc(UUID organizationId);

    List<Notification> findByOrganizationIdAndIsArchivedTrueOrderBySortOrderAscCreatedAtDesc(UUID organizationId);

    Optional<Notification> findByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    long countByOrganizationIdAndIsReadFalseAndIsArchivedFalse(UUID organizationId);

    long countByOrganizationIdAndCategoryAndIsArchivedFalse(UUID organizationId, String category);

    long countByOrganizationIdAndIsArchivedTrue(UUID organizationId);
}
