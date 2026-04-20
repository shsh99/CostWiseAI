package com.costwise.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class ValuationRiskServiceTest {

    private final DcfValuationService dcfValuationService = new DcfValuationService();
    private final PortfolioSummaryService portfolioSummaryService = new PortfolioSummaryService();
    private final ValuationRiskService service =
            new ValuationRiskService(dcfValuationService, portfolioSummaryService);

    @Test
    void valuesStableDividendStock() {
        ValuationRiskService.StockValuationResult result = service.valueStock(
                new ValuationRiskService.StockInput("KOSPI-A1", new BigDecimal("4100"), new BigDecimal("320"), 0.04, 0.11));

        assertEquals(new BigDecimal("4754.29"), result.fairValue());
        assertEquals(new BigDecimal("15.96"), result.upsidePercent());
    }

    @Test
    void valuesBondAndComputesDurationAndConvexity() {
        ValuationRiskService.BondValuationResult result = service.valueBond(
                new ValuationRiskService.BondInput("KB-3Y", new BigDecimal("1000"), new BigDecimal("0.05"), 3, 0.042));

        assertEquals(new BigDecimal("1022.12"), result.price());
        assertEquals(new BigDecimal("2.86"), result.macaulayDurationYears());
        assertEquals(new BigDecimal("2.75"), result.modifiedDurationYears());
        assertEquals(new BigDecimal("10.37"), result.convexity());
    }

    @Test
    void valuesEuropeanCallOption() {
        ValuationRiskService.DerivativeValuationResult result = service.valueDerivative(
                new ValuationRiskService.DerivativeInput(
                        "K200-CALL",
                        "CALL",
                        new BigDecimal("105"),
                        new BigDecimal("100"),
                        1.25,
                        0.035,
                        0.24));

        assertEquals(new BigDecimal("15.98"), result.fairValue());
        assertEquals(new BigDecimal("5.00"), result.intrinsicValue());
        assertEquals(new BigDecimal("10.98"), result.timeValue());
    }

    @Test
    void valuesEuropeanPutOption() {
        ValuationRiskService.DerivativeValuationResult result = service.valueDerivative(
                new ValuationRiskService.DerivativeInput(
                        "K200-PUT",
                        "PUT",
                        new BigDecimal("95"),
                        new BigDecimal("100"),
                        1.25,
                        0.035,
                        0.24));

        assertEquals("PUT", result.type());
        assertEquals(new BigDecimal("10.54"), result.fairValue());
        assertEquals(new BigDecimal("5.00"), result.intrinsicValue());
        assertEquals(new BigDecimal("5.54"), result.timeValue());
    }

    @Test
    void calculatesScenarioRiskMetricsFromProjectNpvDistribution() {
        ValuationRiskService.RiskMetricsResult result = service.calculateRiskMetrics(
                List.of(
                        new BigDecimal("4200000000"),
                        new BigDecimal("3500000000"),
                        new BigDecimal("2800000000"),
                        new BigDecimal("1200000000"),
                        new BigDecimal("-1800000000")));

        assertEquals(new BigDecimal("1980000000.00"), result.meanValue());
        assertEquals(new BigDecimal("2135790251.87"), result.standardDeviation());
        assertEquals(new BigDecimal("-1533374964.33"), result.var95());
        assertEquals(new BigDecimal("-2987848125.86"), result.var99());
        assertEquals(new BigDecimal("-2426135289.62"), result.expectedShortfall95());
    }

    @Test
    void calculatesCreditRiskScoreAndRatingBand() {
        ValuationRiskService.CreditRiskResult result = service.assessCreditRisk(
                new ValuationRiskService.CreditRiskInput(
                        new BigDecimal("3.2"),
                        new BigDecimal("4.5"),
                        new BigDecimal("0.28"),
                        new BigDecimal("12.0")));

        assertEquals(new BigDecimal("59.80"), result.score());
        assertEquals("ELEVATED", result.ratingBand());
    }

    @Test
    void buildsProjectDetailResponseForKnownPortfolioProject() {
        var result = service.loadProjectDetail("13");

        assertEquals("13", result.projectId());
        assertEquals("디지털 플랫폼 구축", result.projectName());
        assertNotNull(result.projectValuation());
        assertNotNull(result.stockValuation());
        assertNotNull(result.bondValuation());
        assertNotNull(result.derivativeValuation());
        assertNotNull(result.riskMetrics());
        assertNotNull(result.creditRisk());
        assertTrue(result.projectValuation().npv().compareTo(BigDecimal.ZERO) > 0);
        assertEquals(5, result.riskMetrics().scenarioValues().size());
    }
}
