package com.shed.teamden.dailyupdate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyUpdateSuggestionDto {
    private List<String> completedAccomplishments;
    private List<String> plannedPriorities;
    private String defaultCompletedText;
    private String defaultPlannedText;
}
