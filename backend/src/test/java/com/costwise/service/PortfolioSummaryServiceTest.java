package com.costwise.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.persistence.ProjectPersistenceRepository;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
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

    @Test
    void loadPortfolioSummaryIsDeterministicAcrossRepeatedCalls() {
        PortfolioSummaryResponse first = service.loadPortfolioSummary();
        PortfolioSummaryResponse second = service.loadPortfolioSummary();

        assertThat(second).isEqualTo(first);
    }

    @Test
    void loadPortfolioSummaryUsesDbBackedProjectionWhenPersistedProjectsExist() {
        ProjectPersistenceRepository repository = mock(ProjectPersistenceRepository.class);
        PortfolioSummaryService dbBackedService = new PortfolioSummaryService(repository);

        String projectId = "20000000-0000-0000-0000-000000000099";
        String scenarioId = "30000000-0000-0000-0000-000000000099";
        when(repository.listProjects()).thenReturn(List.of(
                new ProjectPersistenceRepository.ProjectRecord(
                        projectId,
                        "UND-2026-099",
                        "DB 기반 프로젝트",
                        "insurance_product",
                        "in_review",
                        "db record",
                        LocalDateTime.parse("2026-04-22T09:00:00"))));
        when(repository.listScenarios(projectId)).thenReturn(List.of(
                new ProjectPersistenceRepository.ScenarioRecord(
                        scenarioId,
                        "기준 시나리오",
                        "기준",
                        true,
                        true,
                        LocalDateTime.parse("2026-04-22T09:10:00"))));
        when(repository.findAnalysis(projectId, scenarioId)).thenReturn(new ProjectPersistenceRepository.AnalysisRecord(
                List.of(),
                List.of(
                        new ProjectPersistenceRepository.CashFlowRecord(
                                0,
                                "투자시점",
                                "2026",
                                BigDecimal.ZERO,
                                new BigDecimal("-1500000000"),
                                BigDecimal.ZERO,
                                new BigDecimal("-1500000000"),
                                new BigDecimal("0.115")),
                        new ProjectPersistenceRepository.CashFlowRecord(
                                1,
                                "1년차",
                                "2027",
                                new BigDecimal("900000000"),
                                BigDecimal.ZERO,
                                BigDecimal.ZERO,
                                new BigDecimal("900000000"),
                                new BigDecimal("0.115"))),
                new ProjectPersistenceRepository.ValuationRecord(
                        new BigDecimal("0.115"),
                        new BigDecimal("280000000"),
                        new BigDecimal("0.134"),
                        new BigDecimal("3.20"),
                        "recommend",
                        JsonNodeFactory.instance.objectNode()
                                .put("ownerDepartment", "UND")
                                .put("displayStatus", "조건부 진행")
                                .put("riskLevel", "낮음"))));
        when(repository.listApprovalLogs(projectId)).thenReturn(List.of(
                new ProjectPersistenceRepository.ApprovalLogRecord(
                        "finance_reviewer",
                        "재무검토자",
                        "evaluated",
                        "DCF 재평가를 완료했습니다.",
                        LocalDateTime.parse("2026-04-22T09:30:00"))));

        PortfolioSummaryResponse summary = dbBackedService.loadPortfolioSummary();

        assertThat(summary.overview().projectCount()).isEqualTo(1);
        assertThat(summary.overview().headquarterCount()).isEqualTo(1);
        assertThat(summary.projects()).hasSize(1);
        assertThat(summary.projects().getFirst().projectId()).isEqualTo(projectId);
        assertThat(summary.projects().getFirst().headquarter()).isEqualTo("언더라이팅본부");
        assertThat(summary.projects().getFirst().status()).isEqualTo("조건부 진행");
        assertThat(summary.projects().getFirst().risk()).isEqualTo("낮음");
        assertThat(summary.projects().getFirst().investmentKrw()).isEqualTo(1_500_000_000L);
        assertThat(summary.projects().getFirst().expectedRevenueKrw()).isEqualTo(900_000_000L);
        assertThat(summary.auditEvents()).hasSize(1);
        assertThat(summary.auditEvents().getFirst().domain()).isEqualTo("DCF");
    }
}
