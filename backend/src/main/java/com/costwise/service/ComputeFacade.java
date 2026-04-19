package com.costwise.service;

import com.costwise.api.dto.ComputeRequest;
import com.costwise.api.dto.ComputeResponse;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class ComputeFacade {

    private final AbcAllocationService abcAllocationService;
    private final DcfValuationService dcfValuationService;

    public ComputeFacade(
            AbcAllocationService abcAllocationService, DcfValuationService dcfValuationService) {
        this.abcAllocationService = abcAllocationService;
        this.dcfValuationService = dcfValuationService;
    }

    public ComputeResponse compute(ComputeRequest request) {
        validateDepartments(request);

        AbcAllocationService.AbcResult abcResult = abcAllocationService.allocate(request);
        DcfValuationService.DcfResult dcfResult =
                dcfValuationService.evaluate(request.cashFlows(), request.discountRate());

        List<String> warnings = new ArrayList<>();
        warnings.addAll(abcResult.warnings());

        if (dcfResult.irr() == null) {
            warnings.add("IRR could not be resolved for the provided cash flows.");
        }

        if (dcfResult.paybackPeriodYears() == null) {
            warnings.add("Payback period could not be resolved for the provided cash flows.");
        }

        return new ComputeResponse(
                request.projectName(),
                request.discountRate(),
                new ComputeResponse.AbcResult(abcResult.totalAllocatedCost(), abcResult.departmentAllocations()),
                new ComputeResponse.DcfResult(
                        dcfResult.npv(),
                        dcfResult.irr(),
                        dcfResult.paybackPeriodYears(),
                        dcfResult.projections()),
                warnings);
    }

    private void validateDepartments(ComputeRequest request) {
        Set<String> departmentIds = new HashSet<>();
        for (ComputeRequest.DepartmentInput department : request.departments()) {
            if (!departmentIds.add(department.id())) {
                throw new IllegalArgumentException("Duplicate department id: " + department.id());
            }
        }

        Set<String> knownDepartmentIds = departmentIds;
        for (ComputeRequest.CostPoolInput costPool : request.costPools()) {
            for (ComputeRequest.AllocationTargetInput target : costPool.allocationTargets()) {
                if (!knownDepartmentIds.contains(target.departmentId())) {
                    throw new IllegalArgumentException(
                            "Unknown department id '" + target.departmentId() + "' in cost pool '" + costPool.name() + "'");
                }
            }
        }
    }
}
