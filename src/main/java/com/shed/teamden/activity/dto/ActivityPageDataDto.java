package com.shed.teamden.activity.dto;

import com.shed.teamden.dashboard.dto.ActivityItemDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityPageDataDto {
    private String workspaceBreadcrumb;
    private String currentDateLabel;
    private int totalCount;
    private int completedCount;
    private int documentCount;
    private int assignedCount;
    private int commentCount;
    private String selectedRange;
    private List<ActivityItemDto> activities;
}
