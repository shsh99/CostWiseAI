package com.costwise.api.dto.persistence;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record AnalysisUpsertRequest(
        @NotNull @Valid List<AllocationRuleInput> allocationRules,
        @NotNull @Valid List<CashFlowInput> cashFlows,
        @NotNull @Valid ValuationInput valuation,
        @NotNull @Valid ApprovalInput approval) {

    public record AllocationRuleInput(
            @NotBlank String departmentCode,
            @NotBlank String basis,
            @NotNull BigDecimal allocationRate,
            @NotNull BigDecimal allocatedAmount,
            @NotBlank String costPoolName,
            @NotBlank String costPoolCategory,
            @NotNull BigDecimal costPoolAmount) {}

    public record CashFlowInput(
            int periodNo,
            @NotBlank String periodLabel,
            @NotBlank String yearLabel,
            @NotNull BigDecimal operatingCashFlow,
            @NotNull BigDecimal investmentCashFlow,
            @NotNull BigDecimal financingCashFlow,
            @NotNull BigDecimal discountRate) {}

    public record ValuationInput(
            @NotNull BigDecimal discountRate,
            @NotNull BigDecimal npv,
            @NotNull BigDecimal irr,
            @NotNull BigDecimal paybackPeriod,
            @NotBlank String decision,
            JsonNode assumptions) {}

    public record ApprovalInput(
            @NotBlank String actorRole,
            @NotBlank String actorName,
            @NotBlank String action,
            String comment,
            @NotBlank String projectStatus) {}
}
