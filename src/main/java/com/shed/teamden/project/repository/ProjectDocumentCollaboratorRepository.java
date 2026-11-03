package com.shed.teamden.project.repository;

import com.shed.teamden.project.entity.ProjectDocumentCollaborator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectDocumentCollaboratorRepository extends JpaRepository<ProjectDocumentCollaborator, UUID> {

    @Query("SELECT c FROM ProjectDocumentCollaborator c JOIN FETCH c.user WHERE c.document.id = :docId")
    List<ProjectDocumentCollaborator> findByDocumentIdWithUser(@Param("docId") UUID docId);

    List<ProjectDocumentCollaborator> findByDocumentId(UUID docId);
}
