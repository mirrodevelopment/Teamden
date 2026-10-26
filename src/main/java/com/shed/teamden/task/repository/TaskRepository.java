package com.shed.teamden.task.repository;

import com.shed.teamden.task.entity.Task;
import com.shed.teamden.task.entity.TaskStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project LEFT JOIN FETCH t.assignee WHERE t.organization.id = :orgId AND t.assignee.id = :assigneeId ORDER BY t.dueDate ASC NULLS LAST, t.createdAt DESC")
    List<Task> findByOrganizationIdAndAssigneeId(@Param("orgId") UUID orgId, @Param("assigneeId") UUID assigneeId, Pageable pageable);

    @Query("SELECT t FROM Task t LEFT JOIN FETCH t.project LEFT JOIN FETCH t.assignee WHERE t.organization.id = :orgId ORDER BY t.createdAt DESC")
    List<Task> findByOrganizationId(@Param("orgId") UUID orgId, Pageable pageable);

    long countByOrganizationIdAndStatusIn(UUID orgId, Collection<TaskStatus> statuses);

    long countByOrganizationIdAndAssigneeIdAndStatusIn(UUID orgId, UUID assigneeId, Collection<TaskStatus> statuses);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.organization.id = :orgId AND t.status = :status AND t.completedAt >= :startOfWeek AND t.completedAt <= :endOfWeek")
    long countCompletedTasksInTimeRange(
            @Param("orgId") UUID orgId,
            @Param("status") TaskStatus status,
            @Param("startOfWeek") Instant startOfWeek,
            @Param("endOfWeek") Instant endOfWeek
    );

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status NOT IN :excludedStatuses")
    long countEligibleTasksByProjectId(@Param("projectId") UUID projectId, @Param("excludedStatuses") Collection<TaskStatus> excludedStatuses);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId AND t.status = :completedStatus")
    long countCompletedTasksByProjectId(@Param("projectId") UUID projectId, @Param("completedStatus") TaskStatus completedStatus);
}
