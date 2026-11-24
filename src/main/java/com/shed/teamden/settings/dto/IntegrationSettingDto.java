package com.shed.teamden.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationSettingDto {
    private String id;
    private String code; // "google", "microsoft", "figma"
    private String name;
    private String description;
    private String iconLetter;
    private boolean connected;
    private String statusText; // "Connected", "Available"
}
