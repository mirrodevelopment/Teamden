package com.shed.teamden.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskOptionsDto {

    private List<ProjectOptionDto> projects;
    private List<AssigneeOptionDto> assignees;
    private List<String> columns;
    private List<String> priorities;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectOptionDto {
        private UUID id;
        private String name;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssigneeOptionDto {
        private UUID id;
        private String name;
        private String email;
        private String role;
        private String initials;
    }
}
