package com.shed.teamden.dev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TableMetadataDto {
    private String tableName;
    private long rowCount;
    private List<ColumnMetadataDto> columns;
}
