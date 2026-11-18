package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.EmployeeCollaboration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeCollaborationRepository extends JpaRepository<EmployeeCollaboration, UUID> {
    List<EmployeeCollaboration> findByEmployeeIdOrderBySortOrderAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
