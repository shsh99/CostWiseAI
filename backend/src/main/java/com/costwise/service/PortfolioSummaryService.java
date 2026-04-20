package com.costwise.service;

import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.api.dto.PortfolioSummaryResponse.AuditEvent;
import com.costwise.api.dto.PortfolioSummaryResponse.Assumption;
import com.costwise.api.dto.PortfolioSummaryResponse.HeadquarterSummary;
import com.costwise.api.dto.PortfolioSummaryResponse.Overview;
import com.costwise.api.dto.PortfolioSummaryResponse.ProjectSummary;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PortfolioSummaryService {

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

    public PortfolioSummaryResponse loadPortfolioSummary() {
        List<ProjectSeed> rankedProjects = PROJECTS.stream()
                .sorted(Comparator.comparingLong(ProjectSeed::npvKrw).reversed())
                .toList();

        List<ProjectSummary> projects = java.util.stream.IntStream.range(0, rankedProjects.size())
                .mapToObj(index -> {
                    ProjectSeed seed = rankedProjects.get(index);
                    return new ProjectSummary(
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
                summarizeHeadquarter("UND", "언더라이팅본부", "중간", projectsByHeadquarter.get("언더라이팅본부")),
                summarizeHeadquarter("PROD", "상품개발본부", "중간", projectsByHeadquarter.get("상품개발본부")),
                summarizeHeadquarter("SALES", "영업본부", "중간", projectsByHeadquarter.get("영업본부")),
                summarizeHeadquarter("IT", "IT본부", "높음", projectsByHeadquarter.get("IT본부")),
                summarizeHeadquarter("CORP", "경영지원본부", "낮음", projectsByHeadquarter.get("경영지원본부")));

        long totalInvestment = PROJECTS.stream().mapToLong(ProjectSeed::investmentKrw).sum();
        long totalExpectedRevenue = PROJECTS.stream().mapToLong(ProjectSeed::expectedRevenueKrw).sum();
        long averageNpv = Math.round(
                PROJECTS.stream().mapToLong(ProjectSeed::npvKrw).average().orElse(0.0));
        double averageIrr = PROJECTS.stream().mapToDouble(ProjectSeed::irr).average().orElse(0);
        double averagePayback = PROJECTS.stream().mapToDouble(ProjectSeed::paybackYears).average().orElse(0);
        int approvedCount = (int) PROJECTS.stream().filter(project -> "승인".equals(project.status())).count();
        int conditionalCount = (int) PROJECTS.stream().filter(project -> "조건부 진행".equals(project.status())).count();

        return new PortfolioSummaryResponse(
                "보험사/금융사 전사 포트폴리오 의사결정 플랫폼",
                "전략기획실",
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

    private HeadquarterSummary summarizeHeadquarter(
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
