package com.shed.teamden.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttentionAlertDto {
    private String id;
    private String count; // 02, 03, 01
    private String title;
    private String subtitle;
    private String bgType; // peach, neutral
    private String url;
}
