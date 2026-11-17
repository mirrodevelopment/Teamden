package com.shed.teamden.search.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectedContextDto {
    private GlobalSearchResultDto selectedItem;
    private GlobalSearchResultDto originatedFrom;
    private GlobalSearchResultDto discussedDuring;
    private GlobalSearchResultDto relatedDecision;
    private GlobalSearchResultDto partOfProject;
    private List<GlobalSearchResultDto> relatedItems;
}
