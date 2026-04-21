package com.costwise.api.dto.persistence;

public record AnalysisUpdateResponse(
        String projectId,
        String scenarioId,
        int allocationRuleCount,
        int cashFlowCount) {}
