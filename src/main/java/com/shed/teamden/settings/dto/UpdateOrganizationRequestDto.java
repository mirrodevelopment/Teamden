package com.shed.teamden.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateOrganizationRequestDto {
    private String name;
    private String type;
    private String url;
    private String logoInitials;
    private String timezone;
    private String language;
    private String weekStartsOn;
}
