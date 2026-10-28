package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriorityTaskDto {
    private String id;
    private String column; // NOW, NEXT, LATER
    private String indexNum; // 01, 02, etc.
    private String title;
    private String tag;
    private String dueDateLabel;
    private String dotColor; // red, orange, blue, gray
    private boolean completed;
}
