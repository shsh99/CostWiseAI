package com.costwise.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

import com.costwise.api.dto.ComputeRequest;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class AbcAllocationServiceTest {

    private final AbcAllocationService service = new AbcAllocationService();

    @Test
    void allocatesCostPoolsAcrossDepartments() {
        ComputeRequest request = sampleRequest();

        AbcAllocationService.AbcResult result = service.allocate(request);

        assertEquals(new BigDecimal("60000000.00"), result.totalAllocatedCost());
        assertFalse(result.departmentAllocations().isEmpty());
        assertEquals(new BigDecimal("25200000.00"), result.departmentAllocations().get(0).allocatedCost());
        assertEquals(new BigDecimal("20400000.00"), result.departmentAllocations().get(1).allocatedCost());
        assertEquals(new BigDecimal("14400000.00"), result.departmentAllocations().get(2).allocatedCost());
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
