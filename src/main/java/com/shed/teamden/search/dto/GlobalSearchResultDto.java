package com.shed.teamden.search.dto;

import lombok.Builder;
import lombok.Data;
import java.util.UUID;

@Data
@Builder
public class GlobalSearchResultDto {
    private UUID id;
    private String type;       // TASK, PROJECT, PERSON, ACTIVITY
    private String title;
    private String subtitle;
    private String meta;
    private String status;
    private String url;
    private String iconType;
    private String taskCode;
}
