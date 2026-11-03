package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    @Query("SELECT m FROM ProjectMember m JOIN FETCH m.user WHERE m.project.id = :projectId ORDER BY m.createdAt ASC")
    List<ProjectMember> findByProjectIdWithUser(@Param("projectId") UUID projectId);

    List<ProjectMember> findByOrganizationIdAndProjectId(UUID organizationId, UUID projectId);

    long countByProjectId(UUID projectId);
}
