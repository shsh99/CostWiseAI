package com.costwise.service;

import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.api.dto.PortfolioSummaryResponse.AuditEvent;
import com.costwise.api.dto.PortfolioSummaryResponse.Assumption;
import com.costwise.api.dto.PortfolioSummaryResponse.HeadquarterSummary;
import com.costwise.api.dto.PortfolioSummaryResponse.Overview;
import com.costwise.api.dto.PortfolioSummaryResponse.ProjectSummary;
import com.costwise.persistence.ProjectPersistenceRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PortfolioSummaryService {
    private static final String PORTFOLIO_NAME = "보험사/금융사 전사 포트폴리오 의사결정 플랫폼";
    private static final String PORTFOLIO_OWNER = "전략기획실";

    private final ProjectPersistenceRepository projectRepository;

    private static final List<ProjectSeed> PROJECTS = List.of(
            new ProjectSeed(1, "암보험 신상품 출시", "언더라이팅본부", "UND", 6_500_000_000L, 11_200_000_000L, 2_100_000_000L, 0.182, 2.8, "승인", "중간"),
            new ProjectSeed(2, "인수심사 자동화", "언더라이팅본부", "UND", 4_200_000_000L, 8_100_000_000L, 1_700_000_000L, 0.171, 3.1, "조건부 진행", "낮음"),
            new ProjectSeed(3, "위험요율 재설계", "언더라이팅본부", "UND", 3_100_000_000L, 5_900_000_000L, 900_000_000L, 0.129, 3.8, "검토중", "중간"),
            new ProjectSeed(4, "사전심사 대시보드", "언더라이팅본부", "UND", 2_800_000_000L, 4_700_000_000L, -400_000_000L, 0.094, 4.6, "보류", "높음"),
            new ProjectSeed(5, "디지털 건강보험", "상품개발본부", "PROD", 5_400_000_000L, 9_800_000_000L, 2_400_000_000L, 0.194, 2.5, "승인", "중간"),
            new ProjectSeed(6, "가족보험 패키지", "상품개발본부", "PROD", 4_600_000_000L, 8_300_000_000L, 1_500_000_000L, 0.161, 3.0, "조건부 진행", "낮음"),
            new ProjectSeed(7, "특약 정비", "상품개발본부", "PROD", 3_000_000_000L, 4_900_000_000L, 300_000_000L, 0.112, 4.2, "검토중", "중간"),
            new ProjectSeed(8, "상품약관 자동화", "상품개발본부", "PROD", 2_500_000_000L, 4_100_000_000L, -700_000_000L, 0.089, 4.8, "보류", "높음"),
            new ProjectSeed(9, "GA 영업지원 포털", "영업본부", "SALES", 4_900_000_000L, 9_500_000_000L, 1_900_000_000L, 0.168, 2.9, "승인", "중간"),
            new ProjectSeed(10, "설계사 리드분배", "영업본부", "SALES", 3_800_000_000L, 7_200_000_000L, 1_100_000_000L, 0.143, 3.4, "조건부 진행", "낮음"),
            new ProjectSeed(11, "모바일 견적 고도화", "영업본부", "SALES", 3_100_000_000L, 5_600_000_000L, 200_000_000L, 0.108, 4.1, "검토중", "중간"),
            new ProjectSeed(12, "채널 수익성 분석", "영업본부", "SALES", 2_700_000_000L, 4_300_000_000L, -900_000_000L, 0.081, 5.0, "보류", "높음"),
            new ProjectSeed(13, "디지털 플랫폼 구축", "IT본부", "IT", 7_800_000_000L, 13_600_000_000L, 3_500_000_000L, 0.207, 2.3, "승인", "중간"),
            new ProjectSeed(14, "마이데이터 연계", "IT본부", "IT", 5_900_000_000L, 10_700_000_000L, 2_000_000_000L, 0.176, 2.8, "조건부 진행", "낮음"),
            new ProjectSeed(15, "데이터허브 확장", "IT본부", "IT", 4_300_000_000L, 7_400_000_000L, 800_000_000L, 0.131, 3.7, "검토중", "중간"),
            new ProjectSeed(16, "콜센터 고도화", "IT본부", "IT", 3_900_000_000L, 6_200_000_000L, -1_100_000_000L, 0.079, 5.2, "보류", "높음"),
            new ProjectSeed(17, "원가배분 체계개편", "경영지원본부", "CORP", 2_900_000_000L, 5_300_000_000L, 600_000_000L, 0.122, 3.9, "검토중", "낮음"),
            new ProjectSeed(18, "감사로그 표준화", "경영지원본부", "CORP", 2_400_000_000L, 4_500_000_000L, 400_000_000L, 0.117, 4.0, "조건부 진행", "낮음"),
            new ProjectSeed(19, "성과관리 대시보드", "경영지원본부", "CORP", 3_200_000_000L, 5_100_000_000L, -300_000_000L, 0.097, 4.4, "검토중", "중간"),
            new ProjectSeed(20, "권한통제 재설계", "경영지원본부", "CORP", 2_100_000_000L, 3_700_000_000L, -1_200_000_000L, 0.074, 5.6, "보류", "높음"));

    @Autowired
    public PortfolioSummaryService(ProjectPersistenceRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public PortfolioSummaryService() {
        this.projectRepository = null;
    }

    public PortfolioSummaryResponse loadPortfolioSummary() {
        PortfolioSummaryResponse dbSummary = loadDbBackedSummary();
        if (dbSummary != null) {
            return dbSummary;
        }

        return loadSeedSummary();
    }

    private PortfolioSummaryResponse loadDbBackedSummary() {
        if (projectRepository == null) {
            return null;
        }

        try {
            List<ProjectPersistenceRepository.ProjectRecord> projects = projectRepository.listProjects();
            if (projects.isEmpty()) {
                return null;
            }

            List<ProjectProjection> projectViews = projects.stream()
                    .map(this::projectProjection)
                    .toList();
            List<ProjectProjection> rankedProjects = projectViews.stream()
                    .sorted(Comparator.comparingLong(ProjectProjection::npvKrw).reversed())
                    .toList();
            List<ProjectSummary> projectSummaries = java.util.stream.IntStream.range(0, rankedProjects.size())
                    .mapToObj(index -> rankedProjects.get(index).toSummary(index + 1))
                    .toList();

            Map<String, List<ProjectProjection>> projectsByHeadquarter = projectViews.stream()
                    .collect(Collectors.groupingBy(ProjectProjection::headquarter));
            List<HeadquarterSummary> headquarters = projectsByHeadquarter.entrySet().stream()
                    .map(entry -> summarizeProjectedHeadquarter(
                            headquarterCode(entry.getKey()),
                            entry.getKey(),
                            headquarterRisk(entry.getValue()),
                            entry.getValue()))
                    .sorted(Comparator.comparing(HeadquarterSummary::code))
                    .toList();

            long totalInvestment = projectViews.stream().mapToLong(ProjectProjection::investmentKrw).sum();
            long totalExpectedRevenue = projectViews.stream().mapToLong(ProjectProjection::expectedRevenueKrw).sum();
            long averageNpv = averageLong(projectViews.stream().map(ProjectProjection::npvKrw).toList());
            double averageIrr = averageDouble(projectViews.stream().map(ProjectProjection::irr).toList());
            double averagePayback = averageDouble(projectViews.stream().map(ProjectProjection::paybackYears).toList());
            int approvedCount = (int) projectViews.stream().filter(project -> "승인".equals(project.status())).count();
            int conditionalCount = (int) projectViews.stream().filter(project -> "조건부 진행".equals(project.status())).count();

            List<Assumption> assumptions = List.of(
                    new Assumption("할인율", displayRate(projectViews)),
                    new Assumption("평가기간", displayPeriod(projectViews)),
                    new Assumption("데이터 소스", "DB 프로젝트 " + projectViews.size() + "건"),
                    new Assumption("ABC 적용 본부", headquarters.size() + "개"));

            List<AuditEvent> auditEvents = projectViews.stream()
                    .flatMap(project -> project.auditEvents().stream())
                    .sorted(Comparator.comparing(AuditEvent::at).reversed())
                    .limit(12)
                    .toList();

            return new PortfolioSummaryResponse(
                    PORTFOLIO_NAME,
                    PORTFOLIO_OWNER,
                    portfolioStatus(projectViews),
                    portfolioRisk(projectViews),
                    new Overview(
                            headquarters.size(),
                            projectViews.size(),
                            totalInvestment,
                            totalExpectedRevenue,
                            averageNpv,
                            averageIrr,
                            averagePayback,
                            approvedCount,
                            conditionalCount),
                    headquarters,
                    projectSummaries,
                    assumptions,
                    auditEvents);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private PortfolioSummaryResponse loadSeedSummary() {
        List<ProjectSeed> rankedProjects = PROJECTS.stream()
                .sorted(Comparator.comparingLong(ProjectSeed::npvKrw).reversed())
                .toList();

        List<ProjectSummary> projects = java.util.stream.IntStream.range(0, rankedProjects.size())
                .mapToObj(index -> {
                    ProjectSeed seed = rankedProjects.get(index);
                    return new ProjectSummary(
                            String.valueOf(seed.rank()),
                            index + 1,
                            seed.code(),
                            seed.name(),
                            seed.headquarter(),
                            seed.investmentKrw(),
                            seed.expectedRevenueKrw(),
                            seed.npvKrw(),
                            seed.irr(),
                            seed.paybackYears(),
                            seed.status(),
                            seed.risk());
                })
                .toList();

        Map<String, List<ProjectSeed>> projectsByHeadquarter = PROJECTS.stream()
                .collect(Collectors.groupingBy(ProjectSeed::headquarter));

        List<HeadquarterSummary> headquarters = List.of(
                summarizeSeedHeadquarter("UND", "언더라이팅본부", "중간", projectsByHeadquarter.get("언더라이팅본부")),
                summarizeSeedHeadquarter("PROD", "상품개발본부", "중간", projectsByHeadquarter.get("상품개발본부")),
                summarizeSeedHeadquarter("SALES", "영업본부", "중간", projectsByHeadquarter.get("영업본부")),
                summarizeSeedHeadquarter("IT", "IT본부", "높음", projectsByHeadquarter.get("IT본부")),
                summarizeSeedHeadquarter("CORP", "경영지원본부", "낮음", projectsByHeadquarter.get("경영지원본부")));

        long totalInvestment = PROJECTS.stream().mapToLong(ProjectSeed::investmentKrw).sum();
        long totalExpectedRevenue = PROJECTS.stream().mapToLong(ProjectSeed::expectedRevenueKrw).sum();
        long averageNpv = Math.round(
                PROJECTS.stream().mapToLong(ProjectSeed::npvKrw).average().orElse(0.0));
        double averageIrr = PROJECTS.stream().mapToDouble(ProjectSeed::irr).average().orElse(0);
        double averagePayback = PROJECTS.stream().mapToDouble(ProjectSeed::paybackYears).average().orElse(0);
        int approvedCount = (int) PROJECTS.stream().filter(project -> "승인".equals(project.status())).count();
        int conditionalCount = (int) PROJECTS.stream().filter(project -> "조건부 진행".equals(project.status())).count();

        return new PortfolioSummaryResponse(
                PORTFOLIO_NAME,
                PORTFOLIO_OWNER,
                "검토중",
                "중간",
                new Overview(
                        5,
                        PROJECTS.size(),
                        totalInvestment,
                        totalExpectedRevenue,
                        averageNpv,
                        averageIrr,
                        averagePayback,
                        approvedCount,
                        conditionalCount),
                headquarters,
                projects,
                List.of(
                        new Assumption("할인율", "11.5%"),
                        new Assumption("법인세율", "27.5%"),
                        new Assumption("평가기간", "5개년"),
                        new Assumption("ABC 적용 본부", "5개")),
                List.of(
                        new AuditEvent("전략기획실", "포트폴리오 초안을 등록했습니다.", "PORTFOLIO", LocalDateTime.parse("2026-04-18T10:18:00")),
                        new AuditEvent("재무검토팀", "ABC 배부 기준을 검토했습니다.", "ABC", LocalDateTime.parse("2026-04-19T14:07:00")),
                        new AuditEvent("임원", "상위 5개 프로젝트를 조건부 진행으로 전환했습니다.", "DCF", LocalDateTime.parse("2026-04-20T09:12:00")),
                        new AuditEvent("보안운영팀", "권한 및 감사 로그 정책을 승인했습니다.", "ACCESS", LocalDateTime.parse("2026-04-20T11:42:00"))));
    }

    private HeadquarterSummary summarizeSeedHeadquarter(
            String code, String name, String risk, List<ProjectSeed> seeds) {
        long totalInvestment = seeds.stream().mapToLong(ProjectSeed::investmentKrw).sum();
        long totalExpectedRevenue = seeds.stream().mapToLong(ProjectSeed::expectedRevenueKrw).sum();
        long averageNpv = Math.round(seeds.stream().mapToLong(ProjectSeed::npvKrw).average().orElse(0.0));
        String topProject = seeds.stream()
                .max(Comparator.comparingLong(ProjectSeed::npvKrw))
                .map(ProjectSeed::name)
                .orElse("프로젝트 없음");

        return new HeadquarterSummary(
                code,
                name,
                seeds.size(),
                totalInvestment,
                totalExpectedRevenue,
                averageNpv,
                risk,
                topProject);
    }

    private HeadquarterSummary summarizeProjectedHeadquarter(
            String code, String name, String risk, List<ProjectProjection> projects) {
        long totalInvestment = projects.stream().mapToLong(ProjectProjection::investmentKrw).sum();
        long totalExpectedRevenue = projects.stream().mapToLong(ProjectProjection::expectedRevenueKrw).sum();
        long averageNpv = averageLong(projects.stream().map(ProjectProjection::npvKrw).toList());
        String topProject = projects.stream()
                .max(Comparator.comparingLong(ProjectProjection::npvKrw))
                .map(ProjectProjection::name)
                .orElse("프로젝트 없음");

        return new HeadquarterSummary(
                code,
                name,
                projects.size(),
                totalInvestment,
                totalExpectedRevenue,
                averageNpv,
                risk,
                topProject);
    }

    private ProjectProjection projectProjection(ProjectPersistenceRepository.ProjectRecord project) {
        List<ProjectPersistenceRepository.ScenarioRecord> scenarios = projectRepository.listScenarios(project.id());
        ProjectPersistenceRepository.ScenarioRecord selectedScenario = selectScenario(scenarios);
        ProjectPersistenceRepository.AnalysisRecord analysis = selectedScenario == null
                ? new ProjectPersistenceRepository.AnalysisRecord(List.of(), List.of(), null)
                : projectRepository.findAnalysis(project.id(), selectedScenario.id());

        long investmentKrw = estimateInvestment(analysis.cashFlows());
        long expectedRevenueKrw = estimateExpectedRevenue(analysis.cashFlows());
        long npvKrw = decimalToLong(analysis.valuation() == null ? null : analysis.valuation().npv());
        double irr = decimalToDouble(analysis.valuation() == null ? null : analysis.valuation().irr());
        double paybackYears = decimalToDouble(analysis.valuation() == null ? null : analysis.valuation().paybackPeriod());

        String headquarter = headquarterName(project.code(), analysis);
        String status = displayStatus(project.status(), analysis);
        String risk = displayRisk(analysis, npvKrw);

        List<AuditEvent> auditEvents = projectRepository.listApprovalLogs(project.id()).stream()
                .map(log -> new AuditEvent(
                        log.actorName(),
                        log.comment(),
                        auditDomain(log.action()),
                        log.createdAt()))
                .toList();

        return new ProjectProjection(
                project.id(),
                project.code(),
                project.name(),
                headquarter,
                investmentKrw,
                expectedRevenueKrw,
                npvKrw,
                irr,
                paybackYears,
                status,
                risk,
                analysis.valuation() == null ? null : analysis.valuation().discountRate(),
                analysis.cashFlows().stream().mapToInt(ProjectPersistenceRepository.CashFlowRecord::periodNo).max().orElse(0),
                auditEvents);
    }

    private ProjectPersistenceRepository.ScenarioRecord selectScenario(
            List<ProjectPersistenceRepository.ScenarioRecord> scenarios) {
        return scenarios.stream()
                .filter(ProjectPersistenceRepository.ScenarioRecord::isActive)
                .filter(ProjectPersistenceRepository.ScenarioRecord::isBaseline)
                .findFirst()
                .orElseGet(() -> scenarios.stream()
                        .filter(ProjectPersistenceRepository.ScenarioRecord::isBaseline)
                        .findFirst()
                        .orElseGet(() -> scenarios.stream()
                                .filter(ProjectPersistenceRepository.ScenarioRecord::isActive)
                                .findFirst()
                                .orElse(scenarios.isEmpty() ? null : scenarios.getFirst())));
    }

    private String headquarterName(String projectCode, ProjectPersistenceRepository.AnalysisRecord analysis) {
        String ownerDepartment = null;
        if (analysis.valuation() != null && analysis.valuation().assumptions() != null) {
            ownerDepartment = analysis.valuation().assumptions().path("ownerDepartment").asText(null);
        }
        String code = ownerDepartment != null && !ownerDepartment.isBlank() ? ownerDepartment : codePrefix(projectCode);
        return switch (code) {
            case "UND" -> "언더라이팅본부";
            case "PROD" -> "상품개발본부";
            case "SALES" -> "영업본부";
            case "IT" -> "IT본부";
            case "CORP" -> "경영지원본부";
            default -> "경영지원본부";
        };
    }

    private String displayStatus(String rawStatus, ProjectPersistenceRepository.AnalysisRecord analysis) {
        if (analysis.valuation() != null && analysis.valuation().assumptions() != null) {
            String display = analysis.valuation().assumptions().path("displayStatus").asText(null);
            if (display != null && !display.isBlank()) {
                return display;
            }
        }
        return switch (rawStatus) {
            case "approved" -> "승인";
            case "rejected", "archived" -> "보류";
            case "in_review" -> "조건부 진행";
            default -> "검토중";
        };
    }

    private String displayRisk(ProjectPersistenceRepository.AnalysisRecord analysis, long npvKrw) {
        if (analysis.valuation() != null && analysis.valuation().assumptions() != null) {
            String risk = analysis.valuation().assumptions().path("riskLevel").asText(null);
            if (risk != null && !risk.isBlank()) {
                return risk;
            }
        }
        return npvKrw < 0 ? "높음" : "중간";
    }

    private String auditDomain(String action) {
        return switch (action) {
            case "allocated" -> "ABC";
            case "evaluated" -> "DCF";
            case "approved", "rejected" -> "ACCESS";
            default -> "PORTFOLIO";
        };
    }

    private long estimateInvestment(List<ProjectPersistenceRepository.CashFlowRecord> cashFlows) {
        return cashFlows.stream()
                .filter(cashFlow -> cashFlow.periodNo() == 0)
                .map(ProjectPersistenceRepository.CashFlowRecord::investmentCashFlow)
                .findFirst()
                .map(value -> value.abs().setScale(0, RoundingMode.HALF_UP).longValue())
                .orElse(0L);
    }

    private long estimateExpectedRevenue(List<ProjectPersistenceRepository.CashFlowRecord> cashFlows) {
        BigDecimal total = cashFlows.stream()
                .filter(cashFlow -> cashFlow.periodNo() > 0)
                .map(ProjectPersistenceRepository.CashFlowRecord::operatingCashFlow)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return total.setScale(0, RoundingMode.HALF_UP).longValue();
    }

    private long decimalToLong(BigDecimal value) {
        if (value == null) {
            return 0L;
        }
        return value.setScale(0, RoundingMode.HALF_UP).longValue();
    }

    private double decimalToDouble(BigDecimal value) {
        if (value == null) {
            return 0.0;
        }
        return value.doubleValue();
    }

    private long averageLong(List<Long> values) {
        return values.isEmpty() ? 0L : Math.round(values.stream().mapToLong(Long::longValue).average().orElse(0.0));
    }

    private double averageDouble(List<Double> values) {
        return values.isEmpty() ? 0.0 : values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private String portfolioStatus(List<ProjectProjection> projects) {
        if (projects.stream().anyMatch(project -> "검토중".equals(project.status()))) {
            return "검토중";
        }
        if (projects.stream().anyMatch(project -> "조건부 진행".equals(project.status()))) {
            return "조건부 진행";
        }
        if (projects.stream().allMatch(project -> "승인".equals(project.status()))) {
            return "승인";
        }
        return "검토중";
    }

    private String portfolioRisk(List<ProjectProjection> projects) {
        long highRisk = projects.stream().filter(project -> "높음".equals(project.risk())).count();
        if (highRisk > Math.max(1, projects.size() / 3)) {
            return "높음";
        }
        if (projects.stream().anyMatch(project -> "중간".equals(project.risk()))) {
            return "중간";
        }
        return "낮음";
    }

    private String headquarterCode(String headquarterName) {
        return switch (headquarterName) {
            case "언더라이팅본부" -> "UND";
            case "상품개발본부" -> "PROD";
            case "영업본부" -> "SALES";
            case "IT본부" -> "IT";
            case "경영지원본부" -> "CORP";
            default -> "CORP";
        };
    }

    private String headquarterRisk(List<ProjectProjection> projects) {
        long highRisk = projects.stream().filter(project -> "높음".equals(project.risk())).count();
        if (highRisk > Math.max(1, projects.size() / 2)) {
            return "높음";
        }
        if (projects.stream().anyMatch(project -> "중간".equals(project.risk()))) {
            return "중간";
        }
        return "낮음";
    }

    private String displayRate(List<ProjectProjection> projects) {
        List<BigDecimal> rates = projects.stream()
                .map(ProjectProjection::discountRate)
                .filter(value -> value != null)
                .toList();
        if (rates.isEmpty()) {
            return "11.5%";
        }
        BigDecimal average = rates.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(rates.size()), 4, RoundingMode.HALF_UP);
        return average.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP) + "%";
    }

    private String displayPeriod(List<ProjectProjection> projects) {
        int maxPeriod = projects.stream().mapToInt(ProjectProjection::maxPeriodNo).max().orElse(0);
        return maxPeriod + "개년";
    }

    private String codePrefix(String code) {
        int delimiter = code.indexOf('-');
        return delimiter > 0 ? code.substring(0, delimiter) : code;
    }

    private record ProjectProjection(
            String projectId,
            String code,
            String name,
            String headquarter,
            long investmentKrw,
            long expectedRevenueKrw,
            long npvKrw,
            double irr,
            double paybackYears,
            String status,
            String risk,
            BigDecimal discountRate,
            int maxPeriodNo,
            List<AuditEvent> auditEvents) {

        private ProjectSummary toSummary(int rank) {
            return new ProjectSummary(
                    projectId,
                    rank,
                    code,
                    name,
                    headquarter,
                    investmentKrw,
                    expectedRevenueKrw,
                    npvKrw,
                    irr,
                    paybackYears,
                    status,
                    risk);
        }
    }

    private record ProjectSeed(
            int rank,
            String name,
            String headquarter,
            String code,
            long investmentKrw,
            long expectedRevenueKrw,
            long npvKrw,
            double irr,
            double paybackYears,
            String status,
            String risk) {}
}
