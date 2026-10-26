package com.shed.teamden.dev.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevUserDto {
    private UUID id;
    private String fullName;
    private String email;
    private String role;
    private String organizationName;
    private UUID organizationId;
    private String status;
    private Instant createdAt;
    private Instant lastLoginAt;
    private String unhashedPasswordNote;
}
