package com.shed.teamden.calendar.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectedCalendarDto {
    private String id;
    private String code;
    private String name;
    private String accountEmail;
    private String colorDot;
    private Boolean active;
    private Boolean isDefault;
}
