package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.EmployeeCollaboration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmployeeCollaborationRepository extends JpaRepository<EmployeeCollaboration, UUID> {
    List<EmployeeCollaboration> findByEmployeeIdOrderBySortOrderAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
