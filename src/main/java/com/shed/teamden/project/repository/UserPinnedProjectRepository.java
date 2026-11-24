package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.UserPinnedProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPinnedProjectRepository extends JpaRepository<UserPinnedProject, UUID> {

    @Query("SELECT upp FROM UserPinnedProject upp JOIN FETCH upp.project p " +
           "WHERE upp.user.id = :userId AND upp.organization.id = :orgId " +
           "ORDER BY upp.sortOrder ASC, upp.createdAt ASC")
    List<UserPinnedProject> findByUserIdAndOrganizationIdWithProject(
            @Param("userId") UUID userId, @Param("orgId") UUID orgId);

    Optional<UserPinnedProject> findByUserIdAndProjectId(UUID userId, UUID projectId);

    boolean existsByUserIdAndProjectId(UUID userId, UUID projectId);

    void deleteByUserIdAndProjectId(UUID userId, UUID projectId);

    long countByUserIdAndOrganizationId(UUID userId, UUID orgId);
}
