package com.shed.teamden.dailyupdate.dto;

import com.shed.teamden.dailyupdate.entity.DailyUpdateMood;
import com.shed.teamden.dailyupdate.entity.DailyUpdateStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyUpdateRequestDto {

    @NotBlank(message = "Completed work description cannot be blank")
    private String workCompleted;

    private String workPlanned;

    private String blockers;

    @Builder.Default
    private DailyUpdateStatus status = DailyUpdateStatus.SUBMITTED;

    @Builder.Default
    private DailyUpdateMood moodTag = DailyUpdateMood.ON_TRACK;
}
