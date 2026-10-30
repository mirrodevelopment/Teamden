package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectItemDto {
    private String id;
    private String indexNum;            // e.g. "01", "02"
    private String name;                // "Website Redesign", "Client Application"
    private String description;
    private String status;              // "ACTIVE", "IN_REVIEW", "PLANNING", "COMPLETED", "ON_HOLD"
    private String statusLabel;         // "ACTIVE", "IN REVIEW", etc.
    private String statusDotColor;      // "green", "blue", "orange", "gray"
    private String health;              // "ON_TRACK", "AT_RISK"
    private String healthLabel;         // "ON TRACK", "AT RISK"
    private String healthDotColor;      // "green", "red"
    private String team;                // "Design Team"
    private String dueDate;             // "Due 15 Nov 2026"
    private String priority;            // "High Priority"
    private String milestonesLabel;     // "3/5 milestones" or "06/09"
    private int milestonesCompleted;
    private int milestonesTotal;
    private int blockersCount;
    private List<String> avatars;       // ["PK", "AR", "SK"]
    private String avatarOverflow;      // "+2"
}
