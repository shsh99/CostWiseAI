package com.costwise.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.costwise.api.dto.CostAccountingSummaryResponse;
import org.junit.jupiter.api.Test;

class CostAccountingServiceTest {

    private final CostAccountingService service =
            new CostAccountingService(new PortfolioSummaryService());

    @Test
    void loadSummaryCoversPortfolioRollupsAndDrivers() {
        CostAccountingSummaryResponse summary = service.loadSummary();

        assertThat(summary.overview().headquarterCount()).isEqualTo(5);
        assertThat(summary.overview().projectCount()).isEqualTo(20);
        assertThat(summary.overview().enterpriseTotalCostKrw()).isPositive();
        assertThat(summary.overview().internalTransferTotalKrw()).isPositive();
        assertThat(summary.overview().standardAllocatedCostKrw()).isPositive();
        assertThat(summary.headquarters()).hasSize(5);
        assertThat(summary.projects()).hasSize(20);
        assertThat(summary.factorAnalysis()).hasSizeGreaterThanOrEqualTo(4);
        assertThat(summary.overview().standardAllocatedCostKrw())
                .isEqualTo(
                        summary.projects().stream()
                                .mapToLong(CostAccountingSummaryResponse.ProjectCostSummary::standardAllocatedCostKrw)
                                .sum());
        assertThat(summary.headquarters()).allSatisfy(headquarter -> {
            assertThat(headquarter.personnelCostKrw()).isPositive();
            assertThat(headquarter.projectDirectCostKrw()).isPositive();
            assertThat(headquarter.enterpriseCostKrw()).isPositive();
            assertThat(headquarter.standardAllocatedCostKrw()).isPositive();
        });
    }

    @Test
    void loadSummaryExposesProjectLevelVarianceAndTransferSignals() {
        CostAccountingSummaryResponse summary = service.loadSummary();

        CostAccountingSummaryResponse.ProjectCostSummary project = summary.projects().getFirst();

        assertThat(project.personnelCostKrw()).isPositive();
        assertThat(project.projectDirectCostKrw()).isPositive();
        assertThat(project.standardAllocatedCostKrw()).isPositive();
        assertThat(project.standardCostKrw()).isPositive();
        assertThat(project.actualCostKrw()).isPositive();
        assertThat(project.costVarianceKrw()).isNotZero();
        assertThat(project.internalTransferNetKrw()).isPositive();
        assertThat(project.allocationBasis()).isNotBlank();
        assertThat(project.driverVolume()).isPositive();
        assertThat(project.calculationTrace()).isNotBlank();
        assertThat(summary.factorAnalysis())
                .extracting(CostAccountingSummaryResponse.FactorAnalysis::factor)
                .contains("인력 원가", "프로젝트 직접비", "내부대체가액", "표준원가 배분", "원가/성과 요인");
    }

    @Test
    void loadSummaryIsDeterministicAcrossRepeatedCalls() {
        CostAccountingSummaryResponse first = service.loadSummary();
        CostAccountingSummaryResponse second = service.loadSummary();

        assertThat(second).isEqualTo(first);
    }
}
