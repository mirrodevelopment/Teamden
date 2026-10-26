package com.shed.teamden.dev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ColumnMetadataDto {
    private String columnName;
    private String dataType;
    private boolean nullable;
    private String defaultValue;
    private int ordinalPosition;
    private boolean primaryKey;
    private String foreignKeyTarget;
    private String uniqueConstraint;
}
