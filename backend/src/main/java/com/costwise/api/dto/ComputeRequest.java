package com.costwise.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record ComputeRequest(
        @NotBlank String projectName,
        @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal discountRate,
        @NotEmpty @Valid List<DepartmentInput> departments,
        @NotEmpty @Valid List<CostPoolInput> costPools,
        @NotEmpty @Valid List<CashFlowInput> cashFlows) {

    public record DepartmentInput(@NotBlank String id, @NotBlank String name) {}

    public record CostPoolInput(
            @NotBlank String name,
            @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal amount,
            @NotEmpty @Valid List<AllocationTargetInput> allocationTargets) {}

    public record AllocationTargetInput(
            @NotBlank String departmentId,
            @NotBlank String departmentName,
            @NotNull @DecimalMin(value = "0.0", inclusive = true) BigDecimal weight) {}

    public record CashFlowInput(
            @Min(0) int periodNo,
            @NotBlank String periodLabel,
            @NotBlank String yearLabel,
            @NotNull BigDecimal netCashFlow) {}
}
