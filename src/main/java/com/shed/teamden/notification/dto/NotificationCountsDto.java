package com.shed.teamden.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationCountsDto {
    private long all;
    private long needsAction;
    private long updates;
    private long archived;
    private long unread;
    private long mentions;
    private long following;
}
