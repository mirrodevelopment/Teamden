package com.shed.teamden.project.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponseDto {
    private UUID id;
    private String docNumber;
    private String title;
    private String category;
    private String categoryKey;
    private String fileType;
    private String content;
    private UUID projectId;
    private UUID authorId;
    private String createdAt;
}
