package com.shed.teamden.settings.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityPolicyDto {
    private String id;
    private String policyKey;
    private String title;
    private String description;
    private boolean enabled;
    private String configJson;
}
