package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinnedProjectDto {
    private String id;
    private String name;
    private String status;
    private String statusLabel;
    private String statusDotColor;
    private String url;
    private int sortOrder;
}
