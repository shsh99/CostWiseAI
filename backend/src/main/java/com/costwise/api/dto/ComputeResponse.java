package com.costwise.api.dto;

import java.math.BigDecimal;
import java.util.List;

public record ComputeResponse(
        String projectName,
        BigDecimal discountRate,
        AbcResult abc,
        DcfResult dcf,
        List<String> warnings) {

    public record AbcResult(
            BigDecimal totalAllocatedCost,
            List<DepartmentAllocation> departmentAllocations) {}

    public record DepartmentAllocation(
            String departmentId,
            String departmentName,
            BigDecimal allocatedCost,
            List<CostPoolAllocation> costPoolAllocations) {}

    public record CostPoolAllocation(String costPoolName, BigDecimal allocatedCost) {}

    public record DcfResult(
            BigDecimal npv,
            Double irr,
            Double paybackPeriodYears,
            List<CashFlowProjection> projections) {}

    public record CashFlowProjection(
            int periodNo,
            String periodLabel,
            String yearLabel,
            BigDecimal netCashFlow,
            BigDecimal discountedCashFlow,
            BigDecimal cumulativeCashFlow) {}
}
