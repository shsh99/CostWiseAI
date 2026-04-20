package com.costwise.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.costwise.api.dto.PortfolioSummaryResponse;
import org.junit.jupiter.api.Test;

class PortfolioSummaryServiceTest {

    private final PortfolioSummaryService service = new PortfolioSummaryService();

    @Test
    void loadPortfolioSummaryBuildsFiveHeadquartersAndTwentyProjects() {
        PortfolioSummaryResponse summary = service.loadPortfolioSummary();

        assertThat(summary.overview().headquarterCount()).isEqualTo(5);
        assertThat(summary.overview().projectCount()).isEqualTo(20);
        assertThat(summary.headquarters()).hasSize(5);
        assertThat(summary.projects()).hasSize(20);
        assertThat(summary.overview().approvedCount()).isEqualTo(4);
        assertThat(summary.overview().conditionalCount()).isEqualTo(5);
    }
}
