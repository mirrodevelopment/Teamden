package com.shed.teamden.inbox.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InboxResponseDto {
    private List<InboxItemDto> attentionQueue;
    private List<InboxItemDto> updatesToday;
    private List<InboxItemDto> updatesEarlier;
    private InboxItemDto activeItem;
    private InboxCountsDto counts;
}
