package com.shed.teamden.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponseDto {
    @Builder.Default
    private List<NotificationDto> attentionQueue = new ArrayList<>();

    @Builder.Default
    private List<NotificationDto> updatesToday = new ArrayList<>();

    @Builder.Default
    private List<NotificationDto> updatesEarlier = new ArrayList<>();

    private NotificationDto activeItem;

    private NotificationCountsDto counts;
}
