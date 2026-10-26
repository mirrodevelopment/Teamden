package com.shed.teamden.provisioning.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetupStatusResponse {
    private boolean provisioned;
    private long userCount;
    private long organizationCount;
}
