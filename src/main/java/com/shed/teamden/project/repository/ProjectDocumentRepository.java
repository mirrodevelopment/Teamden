package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.ProjectDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectDocumentRepository extends JpaRepository<ProjectDocument, UUID> {

    @Query("SELECT d FROM ProjectDocument d LEFT JOIN FETCH d.author WHERE d.project.id = :projectId ORDER BY d.isPinned DESC, d.createdAt DESC")
    List<ProjectDocument> findByProjectIdWithAuthor(@Param("projectId") UUID projectId);

    List<ProjectDocument> findByProjectIdAndCategoryKey(UUID projectId, String categoryKey);

    List<ProjectDocument> findByOrganizationIdAndProjectId(UUID organizationId, UUID projectId);
}
