package com.shed.teamden.attendance.repository;

import com.shed.teamden.attendance.entity.AttendanceRecord;
import com.shed.teamden.attendance.entity.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, UUID> {

    long countByOrganizationIdAndAttendanceDateAndStatusIn(
            UUID organizationId,
            LocalDate attendanceDate,
            Collection<AttendanceStatus> statuses
    );

    Optional<AttendanceRecord> findByOrganizationIdAndEmployeeIdAndAttendanceDate(
            UUID organizationId,
            UUID employeeId,
            LocalDate attendanceDate
    );

    @Query("SELECT a FROM AttendanceRecord a LEFT JOIN FETCH a.employee WHERE a.organization.id = :orgId AND a.attendanceDate = :date ORDER BY a.checkInTime DESC")
    List<AttendanceRecord> findByOrganizationIdAndAttendanceDateWithEmployee(
            @Param("orgId") UUID orgId,
            @Param("date") LocalDate date
    );
}
