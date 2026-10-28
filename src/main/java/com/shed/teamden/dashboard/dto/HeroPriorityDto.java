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
public class HeroPriorityDto {
    private String prefix;
    private String title;
    private String projectTag;
    private String teamTag;
    private String priorityLabel;
    private String description;
    private List<String> attachments;
    private String dueDayNum;
    private String dueMonthYear;
    private String ctaText;
}
