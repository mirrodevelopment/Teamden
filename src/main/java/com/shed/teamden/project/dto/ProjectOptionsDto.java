package com.shed.teamden.project.dto;

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
public class ProjectOptionsDto {
    private List<OwnerOptionDto> owners;
    private List<String> statuses;
    private List<String> priorities;
    private List<String> healthOptions;
    private List<String> projectTypes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerOptionDto {
        private UUID id;
        private String name;
        private String email;
        private String role;
        private String initials;
    }
}
