package com.shed.teamden.dashboard.dto;

import com.shed.teamden.attendance.entity.AttendanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSummaryDto {
    private LocalDate todayDate;
    private boolean checkedIn;
    private Instant checkInTime;
    private Instant checkOutTime;
    private AttendanceStatus status;
    private long totalPresentToday;
}
