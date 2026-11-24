package com.shed.teamden.task.repository;

import com.shed.teamden.task.entity.TaskSubtask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TaskSubtaskRepository extends JpaRepository<TaskSubtask, UUID> {

    List<TaskSubtask> findByTaskIdOrderBySeqNumAsc(UUID taskId);

    long countByTaskId(UUID taskId);

    long countByTaskIdAndIsCompletedTrue(UUID taskId);
}
