package com.shed.teamden.employee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDetailDto {
    private EmployeeDto profile;
    private List<EmployeeResponsibilityDto> responsibilities;
    private List<EmployeeTaskSummaryDto> workInMotion;
    private List<EmployeeCollaborationDto> workingTogether;
    private List<EmployeeSharedDocumentDto> sharedKnowledge;
}
