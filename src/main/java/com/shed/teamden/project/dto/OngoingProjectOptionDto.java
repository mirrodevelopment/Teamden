package com.shed.teamden.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OngoingProjectOptionDto {
    private String id;
    private String name;
    private String status;
    private String statusLabel;
    private String statusDotColor;

    @JsonProperty("isPinned")
    private boolean isPinned;

    public boolean isPinned() {
        return isPinned;
    }

    public boolean getPinned() {
        return isPinned;
    }
}
