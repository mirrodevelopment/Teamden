package com.shed.teamden.task.repository;

import com.shed.teamden.task.entity.TaskLinkedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskLinkedDocumentRepository extends JpaRepository<TaskLinkedDocument, UUID> {

    @Query("SELECT tld FROM TaskLinkedDocument tld JOIN FETCH tld.document WHERE tld.task.id = :taskId")
    List<TaskLinkedDocument> findByTaskIdWithDocument(@Param("taskId") UUID taskId);

    long countByTaskId(UUID taskId);
}
