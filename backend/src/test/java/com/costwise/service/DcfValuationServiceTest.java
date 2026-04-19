package com.costwise.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.costwise.api.dto.ComputeRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class DcfValuationServiceTest {

    private final DcfValuationService service = new DcfValuationService();

    @Test
    void calculatesNpvIrrAndPaybackPeriod() {
        DcfValuationService.DcfResult result =
                service.evaluate(sampleRequest().cashFlows(), sampleRequest().discountRate());

        assertEquals(new BigDecimal("25468205.72"), result.npv());
        assertNotNull(result.irr());
        assertTrue(result.irr() > 0.15 && result.irr() < 0.25);
        assertNotNull(result.paybackPeriodYears());
        assertTrue(result.paybackPeriodYears() > 2.3 && result.paybackPeriodYears() < 2.6);
        assertEquals(5, result.projections().size());
    }

    private static ComputeRequest sampleRequest() {
        return new ComputeRequest(
                "보험사 신규 사업 타당성 분석",
                new BigDecimal("0.10"),
                List.of(
                        new ComputeRequest.DepartmentInput("prod", "상품전략본부"),
                        new ComputeRequest.DepartmentInput("ops", "채널운영본부"),
                        new ComputeRequest.DepartmentInput("data", "데이터플랫폼팀")),
                List.of(
                        new ComputeRequest.CostPoolInput(
                                "인건비",
                                new BigDecimal("48000000"),
                                List.of(
                                        new ComputeRequest.AllocationTargetInput("prod", "상품전략본부", new BigDecimal("0.40")),
                                        new ComputeRequest.AllocationTargetInput("ops", "채널운영본부", new BigDecimal("0.35")),
                                        new ComputeRequest.AllocationTargetInput("data", "데이터플랫폼팀", new BigDecimal("0.25")))),
                        new ComputeRequest.CostPoolInput(
                                "클라우드/인프라",
                                new BigDecimal("12000000"),
                                List.of(
                                        new ComputeRequest.AllocationTargetInput("prod", "상품전략본부", new BigDecimal("0.50")),
                                        new ComputeRequest.AllocationTargetInput("ops", "채널운영본부", new BigDecimal("0.30")),
                                        new ComputeRequest.AllocationTargetInput("data", "데이터플랫폼팀", new BigDecimal("0.20"))))),
                List.of(
                        new ComputeRequest.CashFlowInput(0, "투자시점", "2026", new BigDecimal("-70000000")),
                        new ComputeRequest.CashFlowInput(1, "1년차", "2027", new BigDecimal("25000000")),
                        new ComputeRequest.CashFlowInput(2, "2년차", "2028", new BigDecimal("30000000")),
                        new ComputeRequest.CashFlowInput(3, "3년차", "2029", new BigDecimal("32000000")),
                        new ComputeRequest.CashFlowInput(4, "4년차", "2030", new BigDecimal("35000000"))));
    }
}
