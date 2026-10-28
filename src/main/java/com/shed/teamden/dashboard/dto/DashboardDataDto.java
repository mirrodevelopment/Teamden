package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDataDto {
    private String workspaceBreadcrumb;
    private String currentDateLabel;
    private String dayNumber;
    private String dayOfWeek;
    private String month;
    private String year;
    private HeroPriorityDto heroPriority;
    private List<PriorityTaskDto> nowTasks;
    private List<PriorityTaskDto> nextTasks;
    private List<PriorityTaskDto> laterTasks;
    private List<ActivityItemDto> activities;
    private List<ScheduleItemDto> schedule;
    private List<AttentionAlertDto> attentionItems;
}
