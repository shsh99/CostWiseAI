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
    }

    @Test
    void loadSummaryExposesProjectLevelVarianceAndTransferSignals() {
        CostAccountingSummaryResponse summary = service.loadSummary();

        CostAccountingSummaryResponse.ProjectCostSummary project = summary.projects().getFirst();

        assertThat(project.personnelCostKrw()).isPositive();
        assertThat(project.projectDirectCostKrw()).isPositive();
        assertThat(project.standardCostKrw()).isPositive();
        assertThat(project.actualCostKrw()).isPositive();
        assertThat(project.costVarianceKrw()).isNotZero();
        assertThat(project.internalTransferNetKrw()).isNotNull();
    }
}
