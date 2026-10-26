package com.shed.teamden.dev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevOverviewDto {
    private String databaseProduct;
    private String databaseVersion;
    private String databaseName;
    private int tableCount;
    private long userCount;
    private long organizationCount;
    private Instant serverTimestamp;
    private String status;
}
