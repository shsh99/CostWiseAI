package com.costwise.service;

import com.costwise.api.dto.ComputeRequest;
import com.costwise.api.dto.ComputeResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.stereotype.Service;

@Service
public class AbcAllocationService {

    public AbcResult allocate(ComputeRequest request) {
        Map<String, DepartmentAccumulator> departments = new LinkedHashMap<>();
        for (ComputeRequest.DepartmentInput department : request.departments()) {
            departments.put(
                    department.id(),
                    new DepartmentAccumulator(department.id(), department.name()));
        }

        List<String> warnings = new java.util.ArrayList<>();

        for (ComputeRequest.CostPoolInput costPool : request.costPools()) {
            BigDecimal poolAmount = costPool.amount().setScale(2, RoundingMode.HALF_UP);
            BigDecimal weightSum = BigDecimal.ZERO;

            for (ComputeRequest.AllocationTargetInput target : costPool.allocationTargets()) {
                DepartmentAccumulator accumulator = departments.get(target.departmentId());
                if (accumulator == null) {
                    warnings.add("Unknown department referenced in cost pool '" + costPool.name() + "': " + target.departmentId());
                    continue;
                }

                BigDecimal allocatedAmount =
                        poolAmount.multiply(target.weight()).setScale(2, RoundingMode.HALF_UP);
                accumulator.addAllocation(costPool.name(), allocatedAmount);
                weightSum = weightSum.add(target.weight());
            }

            if (weightSum.compareTo(BigDecimal.ONE) != 0) {
                warnings.add(
                        "Weights for cost pool '"
                                + costPool.name()
                                + "' sum to "
                                + weightSum.toPlainString()
                                + " instead of 1.0");
            }
        }

        List<ComputeResponse.DepartmentAllocation> allocations =
                departments.values().stream().map(DepartmentAccumulator::toResponse).toList();

        BigDecimal totalAllocatedCost =
                allocations.stream()
                        .map(ComputeResponse.DepartmentAllocation::allocatedCost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .setScale(2, RoundingMode.HALF_UP);

        return new AbcResult(totalAllocatedCost, allocations, warnings);
    }

    public record AbcResult(
            BigDecimal totalAllocatedCost,
            List<ComputeResponse.DepartmentAllocation> departmentAllocations,
            List<String> warnings) {}

    private static final class DepartmentAccumulator {
        private final String departmentId;
        private final String departmentName;
        private final Map<String, BigDecimal> costPoolAllocations = new LinkedHashMap<>();
        private BigDecimal allocatedCost = BigDecimal.ZERO;

        private DepartmentAccumulator(String departmentId, String departmentName) {
            this.departmentId = departmentId;
            this.departmentName = departmentName;
        }

        private void addAllocation(String costPoolName, BigDecimal amount) {
            costPoolAllocations.merge(costPoolName, amount, BigDecimal::add);
            allocatedCost = allocatedCost.add(amount);
        }

        private ComputeResponse.DepartmentAllocation toResponse() {
            List<ComputeResponse.CostPoolAllocation> breakdown =
                    costPoolAllocations.entrySet().stream()
                            .map(entry -> new ComputeResponse.CostPoolAllocation(entry.getKey(), entry.getValue()))
                            .toList();

            return new ComputeResponse.DepartmentAllocation(
                    departmentId,
                    departmentName,
                    allocatedCost.setScale(2, RoundingMode.HALF_UP),
                    breakdown);
        }
    }
}
