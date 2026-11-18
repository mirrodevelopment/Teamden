package com.shed.teamden.employee.repository;

import com.shed.teamden.employee.entity.EmployeeSharedDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeSharedDocumentRepository extends JpaRepository<EmployeeSharedDocument, UUID> {
    List<EmployeeSharedDocument> findByEmployeeIdOrderBySortOrderAsc(UUID employeeId);
    void deleteByEmployeeId(UUID employeeId);
}
