package com.costwise.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ValuationRiskResponse(
        String projectId,
        String projectName,
        ProjectValuation projectValuation,
        ValuationBasis valuationBasis,
        StockValuation stockValuation,
        BondValuation bondValuation,
        DerivativeValuation derivativeValuation,
        RiskMetrics riskMetrics,
        CreditRisk creditRisk) {

    public record ProjectValuation(
            BigDecimal npv,
            Double irr,
            Double paybackPeriodYears,
            String outlook) {}

    public record ValuationBasis(
            BigDecimal discountRate,
            BigDecimal riskPremium,
            String ownerDepartment,
            String interpretation,
            List<ScenarioAssumption> scenarioAssumptions) {}

    public record ScenarioAssumption(
            String label,
            BigDecimal npv,
            BigDecimal probability,
            String note) {}

    public record StockValuation(
            String symbol,
            BigDecimal currentPrice,
            BigDecimal fairValue,
            BigDecimal upsidePercent,
            BigDecimal dividendYield) {}

    public record BondValuation(
            String bondCode,
            BigDecimal price,
            BigDecimal macaulayDurationYears,
            BigDecimal modifiedDurationYears,
            BigDecimal convexity) {}

    public record DerivativeValuation(
            String contractCode,
            String type,
            BigDecimal fairValue,
            BigDecimal intrinsicValue,
            BigDecimal timeValue) {}

    public record RiskMetrics(
            BigDecimal meanValue,
            BigDecimal standardDeviation,
            BigDecimal var95,
            BigDecimal var99,
            BigDecimal expectedShortfall95,
            List<BigDecimal> scenarioValues) {}

    public record CreditRisk(BigDecimal score, String ratingBand) {}
}
