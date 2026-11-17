package com.shed.teamden.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedSearchDto {
    private String id;
    private String name;
    private String query;
    private String category;
    private Long count;
}
