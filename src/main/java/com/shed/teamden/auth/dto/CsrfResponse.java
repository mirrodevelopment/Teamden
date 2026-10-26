package com.shed.teamden.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CsrfResponse {
    private String token;
    private String headerName;
    private String parameterName;
}
