package com.shed.teamden.dev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableDataDto {
    private String tableName;
    private long totalRows;
    private List<String> columnNames;
    private List<Map<String, Object>> rows;
    private Map<String, String> resolvedReferences;
}
