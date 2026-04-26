package com.costwise.service;

import com.costwise.api.dto.CostAccountingSummaryResponse;
import com.costwise.api.dto.PortfolioSummaryResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class CostAccountingService {

    private static final List<HeadquarterPlan> HEADQUARTERS = List.of(
            new HeadquarterPlan("UND", "언더라이팅본부", 1.12, 0.64, 0.22, 0.13),
            new HeadquarterPlan("PROD", "상품개발본부", 1.08, 0.62, 0.21, 0.12),
            new HeadquarterPlan("SALES", "영업본부", 1.05, 0.60, 0.20, 0.11),
            new HeadquarterPlan("IT", "IT본부", 1.18, 0.68, 0.24, 0.14),
            new HeadquarterPlan("CORP", "경영지원본부", 1.02, 0.58, 0.19, 0.10));

    private final PortfolioSummaryService portfolioSummaryService;

    public CostAccountingService(PortfolioSummaryService portfolioSummaryService) {
        this.portfolioSummaryService = portfolioSummaryService;
    }

    public CostAccountingSummaryResponse loadSummary() {
        PortfolioSummaryResponse portfolio = portfolioSummaryService.loadPortfolioSummary();
        long enterpriseSupportPool = round(portfolio.overview().totalInvestmentKrw() * 0.14);
        long standardCostPool = round(portfolio.overview().totalInvestmentKrw() * 0.11);
        long totalDriverVolume = portfolio.projects().stream()
                .mapToLong(project -> round(driverVolume(project)))
                .sum();
        List<ProjectCostView> projectCostViews = new ArrayList<>();

        for (PortfolioSummaryResponse.ProjectSummary project : portfolio.projects()) {
            HeadquarterPlan plan = planFor(project.headquarter());
            long driverVolume = round(driverVolume(project));
            long personnelCost = round(project.investmentKrw() * plan.personnelShare() * plan.multiplier());
            long projectDirectCost = round(project.investmentKrw() * plan.directShare());
            long enterpriseAllocatedCost = allocatePool(enterpriseSupportPool, driverVolume, totalDriverVolume);
            long standardAllocatedCost = allocatePool(standardCostPool, driverVolume, totalDriverVolume);
            long standardCost = personnelCost + projectDirectCost + standardAllocatedCost;
            long actualCost = personnelCost + projectDirectCost + enterpriseAllocatedCost + round(project.investmentKrw() * plan.transferShare());
            long transferNet = round(project.investmentKrw() * plan.transferShare());
            long variance = actualCost - standardCost;
            String allocationBasis = "활동기준(인력55%+직접비45%)";
            String calculationTrace = "표준원가=인력원가+프로젝트직접비+표준배부액, 실제원가=표준원가+전사배부액+내부대체가액";

            projectCostViews.add(
                    new ProjectCostView(
                            project.rank(),
                            project.code(),
                            project.name(),
                            project.headquarter(),
                            allocationBasis,
                            driverVolume,
                            personnelCost,
                            projectDirectCost,
                            standardAllocatedCost,
                            enterpriseAllocatedCost,
                            standardCost,
                            actualCost,
                            variance,
                            transferNet,
                            calculationTrace));
        }

        Map<String, List<ProjectCostView>> byHeadquarter = new LinkedHashMap<>();
        for (ProjectCostView project : projectCostViews) {
            byHeadquarter.computeIfAbsent(project.headquarter(), key -> new ArrayList<>()).add(project);
        }

        List<CostAccountingSummaryResponse.HeadquarterCostSummary> headquarters = HEADQUARTERS.stream()
                .map(plan -> summarizeHeadquarter(plan, byHeadquarter.getOrDefault(plan.name(), List.of())))
                .toList();

        long enterpriseTotalCost = projectCostViews.stream().mapToLong(ProjectCostView::actualCostKrw).sum();
        long internalTransferTotal = projectCostViews.stream().mapToLong(ProjectCostView::internalTransferNetKrw).sum();
        long standardAllocatedTotal = projectCostViews.stream().mapToLong(ProjectCostView::standardAllocatedCostKrw).sum();

        List<CostAccountingSummaryResponse.FactorAnalysis> factorAnalysis = List.of(
                new CostAccountingSummaryResponse.FactorAnalysis(
                        "인력 원가",
                        projectCostViews.stream().mapToLong(ProjectCostView::personnelCostKrw).sum(),
                        "5개 본부의 인력 배치를 전사 프로젝트에 배부합니다."),
                new CostAccountingSummaryResponse.FactorAnalysis(
                        "프로젝트 직접비",
                        projectCostViews.stream().mapToLong(ProjectCostView::projectDirectCostKrw).sum(),
                        "프로젝트별 직접 투입 비용을 본부와 전사로 연결합니다."),
                new CostAccountingSummaryResponse.FactorAnalysis(
                        "내부대체가액",
                        internalTransferTotal,
                        "공통 플랫폼과 지원 기능의 내부대체가액을 프로젝트에 반영합니다."),
                new CostAccountingSummaryResponse.FactorAnalysis(
                        "표준원가 배분",
                        projectCostViews.stream().mapToLong(ProjectCostView::standardAllocatedCostKrw).sum(),
                        "전사 공통 원가 풀을 표준 드라이버로 배분합니다."),
                new CostAccountingSummaryResponse.FactorAnalysis(
                        "원가/성과 요인",
                        projectCostViews.stream().mapToLong(ProjectCostView::costVarianceKrw).sum(),
                        "표준원가와 실제원가의 차이를 원가/성과 요인으로 해석합니다."));

        return new CostAccountingSummaryResponse(
                portfolio.portfolioName(),
                new CostAccountingSummaryResponse.Overview(
                        portfolio.overview().headquarterCount(),
                        portfolio.overview().projectCount(),
                        enterpriseTotalCost,
                        internalTransferTotal,
                        standardAllocatedTotal),
                headquarters,
                projectCostViews.stream()
                        .sorted(Comparator.comparingInt(ProjectCostView::rank))
                        .map(this::toResponse)
                        .toList(),
                factorAnalysis);
    }

    private CostAccountingSummaryResponse.HeadquarterCostSummary summarizeHeadquarter(
            HeadquarterPlan plan, List<ProjectCostView> projects) {
        long personnelCost = projects.stream().mapToLong(ProjectCostView::personnelCostKrw).sum();
        long projectDirectCost = projects.stream().mapToLong(ProjectCostView::projectDirectCostKrw).sum();
        long enterpriseCost = projects.stream().mapToLong(ProjectCostView::actualCostKrw).sum();
        long internalTransferTotal = projects.stream().mapToLong(ProjectCostView::internalTransferNetKrw).sum();
        long standardAllocatedCost = projects.stream().mapToLong(ProjectCostView::standardAllocatedCostKrw).sum();
        String dominantFactor =
                projects.isEmpty()
                        ? "인력 원가"
                        : (personnelCost >= projectDirectCost ? "인력 원가" : "프로젝트 직접비");

        return new CostAccountingSummaryResponse.HeadquarterCostSummary(
                plan.code(),
                plan.name(),
                personnelCost,
                projectDirectCost,
                enterpriseCost,
                internalTransferTotal,
                standardAllocatedCost,
                dominantFactor);
    }

    private CostAccountingSummaryResponse.ProjectCostSummary toResponse(ProjectCostView project) {
        return new CostAccountingSummaryResponse.ProjectCostSummary(
                project.rank(),
                project.projectId(),
                project.projectName(),
                project.headquarter(),
                project.allocationBasis(),
                project.driverVolume(),
                project.personnelCostKrw(),
                project.projectDirectCostKrw(),
                project.standardAllocatedCostKrw(),
                project.standardCostKrw(),
                project.actualCostKrw(),
                project.costVarianceKrw(),
                project.internalTransferNetKrw(),
                project.calculationTrace());
    }

    private HeadquarterPlan planFor(String headquarter) {
        return HEADQUARTERS.stream()
                .filter(plan -> plan.name().equals(headquarter))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown headquarter: " + headquarter));
    }

    // The MVP uses a single deterministic driver so standard-cost and enterprise allocations stay auditable.
    private double driverVolume(PortfolioSummaryResponse.ProjectSummary project) {
        HeadquarterPlan plan = planFor(project.headquarter());
        return project.investmentKrw() * ((plan.personnelShare() * 0.55) + (plan.directShare() * 0.45));
    }

    private long allocatePool(long poolAmount, long driverVolume, long totalDriverVolume) {
        if (totalDriverVolume == 0) {
            return 0L;
        }
        return round(poolAmount * ((double) driverVolume / totalDriverVolume));
    }

    private static long round(double value) {
        return BigDecimal.valueOf(value).setScale(0, RoundingMode.HALF_UP).longValueExact();
    }

    private record HeadquarterPlan(
            String code,
            String name,
            double multiplier,
            double personnelShare,
            double directShare,
            double transferShare) {}

    private record ProjectCostView(
            int rank,
            String projectId,
            String projectName,
            String headquarter,
            String allocationBasis,
            long driverVolume,
            long personnelCostKrw,
            long projectDirectCostKrw,
            long standardAllocatedCostKrw,
            long enterpriseAllocatedCostKrw,
            long standardCostKrw,
            long actualCostKrw,
            long costVarianceKrw,
            long internalTransferNetKrw,
            String calculationTrace) {}
}
