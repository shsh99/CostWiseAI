package com.costwise.api.dto;

import java.util.List;

public record CostAccountingSummaryResponse(
        String portfolioName,
        Overview overview,
        List<HeadquarterCostSummary> headquarters,
        List<ProjectCostSummary> projects,
        List<FactorAnalysis> factorAnalysis) {

    public record Overview(
            int headquarterCount,
            int projectCount,
            long enterpriseTotalCostKrw,
            long internalTransferTotalKrw,
            long standardAllocatedCostKrw) {}

    public record HeadquarterCostSummary(
            String code,
            String name,
            long personnelCostKrw,
            long projectDirectCostKrw,
            long enterpriseCostKrw,
            long internalTransferTotalKrw,
            long standardAllocatedCostKrw,
            String dominantFactor) {}

    public record ProjectCostSummary(
            int rank,
            String projectId,
            String projectName,
            String headquarter,
            String allocationBasis,
            long driverVolume,
            long personnelCostKrw,
            long projectDirectCostKrw,
            long standardAllocatedCostKrw,
            long standardCostKrw,
            long actualCostKrw,
            long costVarianceKrw,
            long internalTransferNetKrw,
            String calculationTrace) {}

    public record FactorAnalysis(String factor, long varianceImpactKrw, String note) {}
}
