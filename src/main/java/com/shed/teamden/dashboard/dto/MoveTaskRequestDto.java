package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MoveTaskRequestDto {
    private String targetColumn;
    private Integer targetIndex;
}
