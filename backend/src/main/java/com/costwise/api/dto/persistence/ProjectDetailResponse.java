package com.costwise.api.dto.persistence;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProjectDetailResponse(
        String id,
        String code,
        String name,
        String businessType,
        String status,
        String description,
        LocalDateTime createdAt,
        List<ScenarioDetailResponse> scenarios,
        ApprovalSummary approval) {

    public record ScenarioDetailResponse(
            String id,
            String name,
            String description,
            boolean isBaseline,
            boolean isActive,
            LocalDateTime createdAt,
            List<AllocationRule> allocationRules,
            List<CashFlow> cashFlows,
            Valuation valuation) {}

    public record AllocationRule(
            String departmentCode,
            String basis,
            BigDecimal allocationRate,
            BigDecimal allocatedAmount,
            String costPoolName,
            String costPoolCategory,
            BigDecimal costPoolAmount) {}

    public record CashFlow(
            int periodNo,
            String periodLabel,
            String yearLabel,
            BigDecimal operatingCashFlow,
            BigDecimal investmentCashFlow,
            BigDecimal financingCashFlow,
            BigDecimal netCashFlow,
            BigDecimal discountRate) {}

    public record Valuation(
            BigDecimal discountRate,
            BigDecimal npv,
            BigDecimal irr,
            BigDecimal paybackPeriod,
            String decision,
            JsonNode assumptions) {}

    public record ApprovalSummary(
            String status,
            String lastAction,
            String lastActor,
            String lastComment,
            LocalDateTime updatedAt,
            List<ApprovalEvent> logs) {}

    public record ApprovalEvent(
            String actorRole,
            String actorName,
            String action,
            String comment,
            LocalDateTime createdAt) {}
}
