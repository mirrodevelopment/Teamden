package com.shed.teamden.search.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class GlobalSearchResponseDto {
    private String query;
    private List<GlobalSearchResultDto> results;
    private Map<String, Long> counts;
    private int total;
}
