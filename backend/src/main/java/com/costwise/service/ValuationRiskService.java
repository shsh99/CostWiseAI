package com.costwise.service;

import com.costwise.api.dto.ComputeRequest;
import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.api.dto.ValuationRiskResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ValuationRiskService {

    private static final List<ProjectProfile> PROJECTS = List.of(
            new ProjectProfile("1", "암보험 신상품 출시", "언더라이팅본부", 650_000_000L),
            new ProjectProfile("2", "인수심사 자동화", "언더라이팅본부", 420_000_000L),
            new ProjectProfile("3", "위험요율 재설계", "언더라이팅본부", 310_000_000L),
            new ProjectProfile("4", "사전심사 대시보드", "언더라이팅본부", 280_000_000L),
            new ProjectProfile("5", "디지털 건강보험", "상품개발본부", 540_000_000L),
            new ProjectProfile("6", "가족보험 패키지", "상품개발본부", 460_000_000L),
            new ProjectProfile("7", "특약 정비", "상품개발본부", 300_000_000L),
            new ProjectProfile("8", "상품약관 자동화", "상품개발본부", 250_000_000L),
            new ProjectProfile("9", "GA 영업지원 포털", "영업본부", 490_000_000L),
            new ProjectProfile("10", "설계사 리드분배", "영업본부", 380_000_000L),
            new ProjectProfile("11", "모바일 견적 고도화", "영업본부", 310_000_000L),
            new ProjectProfile("12", "채널 수익성 분석", "영업본부", 270_000_000L),
            new ProjectProfile("13", "디지털 플랫폼 구축", "IT본부", 780_000_000L),
            new ProjectProfile("14", "마이데이터 연계", "IT본부", 590_000_000L),
            new ProjectProfile("15", "데이터허브 확장", "IT본부", 430_000_000L),
            new ProjectProfile("16", "콜센터 고도화", "IT본부", 390_000_000L),
            new ProjectProfile("17", "원가배분 체계개편", "경영지원본부", 290_000_000L),
            new ProjectProfile("18", "감사로그 표준화", "경영지원본부", 240_000_000L),
            new ProjectProfile("19", "성과관리 대시보드", "경영지원본부", 320_000_000L),
            new ProjectProfile("20", "권한통제 재설계", "경영지원본부", 210_000_000L));

    private final DcfValuationService dcfValuationService;

    public ValuationRiskService(DcfValuationService dcfValuationService) {
        this.dcfValuationService = dcfValuationService;
    }

    public StockValuationResult valueStock(StockInput input) {
        BigDecimal fairValue =
                input.annualDividend()
                        .multiply(BigDecimal.valueOf(1.0 + input.dividendGrowthRate()))
                        .divide(
                                BigDecimal.valueOf(input.requiredReturnRate() - input.dividendGrowthRate()),
                                2,
                                RoundingMode.HALF_UP);
        BigDecimal upside =
                fairValue.subtract(input.currentPrice())
                        .divide(input.currentPrice(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100.0))
                        .setScale(2, RoundingMode.HALF_UP);
        BigDecimal dividendYield =
                input.annualDividend()
                        .divide(input.currentPrice(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100.0))
                        .setScale(2, RoundingMode.HALF_UP);

        return new StockValuationResult(
                input.symbol(),
                input.currentPrice().setScale(2, RoundingMode.HALF_UP),
                fairValue.setScale(2, RoundingMode.HALF_UP),
                upside,
                dividendYield);
    }

    public BondValuationResult valueBond(BondInput input) {
        int periods = input.yearsToMaturity();
        double coupon = input.faceValue().doubleValue() * input.couponRate().doubleValue();
        double yield = input.yieldToMaturity();
        double price = 0.0;
        double weightedPresentValue = 0.0;
        double convexityNumerator = 0.0;

        for (int period = 1; period <= periods; period++) {
            double cashFlow = period == periods ? coupon + input.faceValue().doubleValue() : coupon;
            double discountFactor = Math.pow(1.0 + yield, period);
            double presentValue = cashFlow / discountFactor;
            price += presentValue;
            weightedPresentValue += period * presentValue;
            convexityNumerator += period * (period + 1) * presentValue;
        }

        double macaulayDuration = weightedPresentValue / price;
        double modifiedDuration = macaulayDuration / (1.0 + yield);
        double convexity = convexityNumerator / (price * Math.pow(1.0 + yield, 2.0));

        return new BondValuationResult(
                input.bondCode(),
                BigDecimal.valueOf(price).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(macaulayDuration).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(modifiedDuration).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(convexity).setScale(2, RoundingMode.HALF_UP));
    }

    public DerivativeValuationResult valueDerivative(DerivativeInput input) {
        double s = input.underlyingPrice().doubleValue();
        double k = input.strikePrice().doubleValue();
        double t = input.timeToExpiryYears();
        double r = input.riskFreeRate();
        double sigma = input.volatility();

        double sqrtT = Math.sqrt(t);
        double d1 = (Math.log(s / k) + (r + (sigma * sigma) / 2.0) * t) / (sigma * sqrtT);
        double d2 = d1 - sigma * sqrtT;
        double fairValue = s * normalCdf(d1) - k * Math.exp(-r * t) * normalCdf(d2);
        double intrinsicValue = Math.max(0.0, s - k);
        double timeValue = fairValue - intrinsicValue;

        return new DerivativeValuationResult(
                input.contractCode(),
                input.type().toUpperCase(Locale.ROOT),
                BigDecimal.valueOf(fairValue).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(intrinsicValue).setScale(2, RoundingMode.HALF_UP),
                BigDecimal.valueOf(timeValue).setScale(2, RoundingMode.HALF_UP));
    }

    public RiskMetricsResult calculateRiskMetrics(List<BigDecimal> values) {
        List<BigDecimal> safeValues = new ArrayList<>(values);
        if (safeValues.isEmpty()) {
            throw new IllegalArgumentException("Risk metric values must not be empty");
        }

        double mean =
                safeValues.stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0.0);
        double variance = 0.0;
        for (BigDecimal value : safeValues) {
            double delta = value.doubleValue() - mean;
            variance += delta * delta;
        }
        variance /= Math.max(1, safeValues.size());
        double standardDeviation = Math.sqrt(variance);

        double var95 = mean - (1.645 * standardDeviation);
        double var99 = mean - (2.326 * standardDeviation);
        double expectedShortfall95 = mean - (2.063 * standardDeviation);

        return new RiskMetricsResult(
                scale(mean),
                scale(standardDeviation),
                scale(var95),
                scale(var99),
                scale(expectedShortfall95));
    }

    public CreditRiskResult assessCreditRisk(CreditRiskInput input) {
        double leverageScore = Math.max(0.0, 100.0 - (input.leverage().doubleValue() * 10.0));
        double coverageScore = Math.min(100.0, input.debtServiceCoverage().doubleValue() * 10.0);
        double volatilityScore = Math.max(0.0, 100.0 - (input.volatility().doubleValue() * 100.0));
        double debtScore = Math.max(0.0, 100.0 - (input.debtRatio().doubleValue() * 4.0));

        BigDecimal score =
                scale((leverageScore + coverageScore + volatilityScore + debtScore) / 4.0 + 0.55);
        String ratingBand;
        if (score.doubleValue() >= 80.0) {
            ratingBand = "STRONG";
        } else if (score.doubleValue() >= 55.0) {
            ratingBand = "ELEVATED";
        } else if (score.doubleValue() >= 35.0) {
            ratingBand = "WATCHLIST";
        } else {
            ratingBand = "CRITICAL";
        }

        return new CreditRiskResult(score, ratingBand);
    }

    public ValuationRiskResponse loadProjectDetail(String projectId) {
        ProjectProfile profile =
                PROJECTS.stream()
                        .filter(project -> project.projectId().equals(projectId))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Unknown project id: " + projectId));

        List<ComputeRequest.CashFlowInput> cashFlows = profile.cashFlows();
        BigDecimal discountRate = BigDecimal.valueOf(0.115);
        DcfValuationService.DcfResult dcfResult = dcfValuationService.evaluate(cashFlows, discountRate);

        BigDecimal npv =
                dcfResult.npv().setScale(2, RoundingMode.HALF_UP);
        ValuationRiskResponse.ProjectValuation projectValuation =
                new ValuationRiskResponse.ProjectValuation(
                        npv,
                        dcfResult.irr(),
                        dcfResult.paybackPeriodYears(),
                        npv.signum() >= 0 ? "확대" : "보수");

        StockValuationResult stockValuation =
                valueStock(profile.stockInput());
        BondValuationResult bondValuation =
                valueBond(profile.bondInput());
        DerivativeValuationResult derivativeValuation =
                valueDerivative(profile.derivativeInput());

        List<BigDecimal> scenarioValues = List.of(
                npv.multiply(BigDecimal.valueOf(1.20)),
                npv.multiply(BigDecimal.valueOf(0.95)),
                npv.multiply(BigDecimal.valueOf(0.75)),
                npv.multiply(BigDecimal.valueOf(0.40)),
                npv.multiply(BigDecimal.valueOf(-0.30)));
        RiskMetricsResult riskMetrics = calculateRiskMetrics(scenarioValues);
        CreditRiskResult creditRisk = assessCreditRisk(profile.creditRiskInput());

        return new ValuationRiskResponse(
                profile.projectId(),
                profile.projectName(),
                projectValuation,
                new ValuationRiskResponse.StockValuation(
                        stockValuation.symbol(),
                        stockValuation.currentPrice(),
                        stockValuation.fairValue(),
                        stockValuation.upsidePercent(),
                        stockValuation.dividendYield()),
                new ValuationRiskResponse.BondValuation(
                        bondValuation.bondCode(),
                        bondValuation.price(),
                        bondValuation.macaulayDurationYears(),
                        bondValuation.modifiedDurationYears(),
                        bondValuation.convexity()),
                new ValuationRiskResponse.DerivativeValuation(
                        derivativeValuation.contractCode(),
                        derivativeValuation.type(),
                        derivativeValuation.fairValue(),
                        derivativeValuation.intrinsicValue(),
                        derivativeValuation.timeValue()),
                new ValuationRiskResponse.RiskMetrics(
                        riskMetrics.meanValue(),
                        riskMetrics.standardDeviation(),
                        riskMetrics.var95(),
                        riskMetrics.var99(),
                        riskMetrics.expectedShortfall95(),
                        scenarioValues.stream().map(value -> scale(value)).toList()),
                new ValuationRiskResponse.CreditRisk(creditRisk.score(), creditRisk.ratingBand()));
    }

    private double normalCdf(double value) {
        return 0.5 * (1.0 + erf(value / Math.sqrt(2.0)));
    }

    private static BigDecimal scale(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private double erf(double value) {
        double sign = value < 0 ? -1.0 : 1.0;
        double abs = Math.abs(value);
        double t = 1.0 / (1.0 + 0.3275911 * abs);
        double y =
                1.0
                        - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736)
                                        * t
                                        + 0.254829592)
                                * t
                                * Math.exp(-(abs * abs));
        return sign * y;
    }

    private record ProjectProfile(
            String projectId,
            String projectName,
            String headquarter,
            long baseInvestmentKrw) {

        private List<ComputeRequest.CashFlowInput> cashFlows() {
            long scaledInvestment = Math.max(100_000_000L, baseInvestmentKrw);
            long year1 = Math.round(scaledInvestment * 0.30);
            long year2 = Math.round(scaledInvestment * 0.36);
            long year3 = Math.round(scaledInvestment * 0.42);
            long year4 = Math.round(scaledInvestment * 0.48);
            long year5 = Math.round(scaledInvestment * 0.55);

            return List.of(
                    new ComputeRequest.CashFlowInput(0, "0년차", "2026", BigDecimal.valueOf(-scaledInvestment)),
                    new ComputeRequest.CashFlowInput(1, "1년차", "2027", BigDecimal.valueOf(year1)),
                    new ComputeRequest.CashFlowInput(2, "2년차", "2028", BigDecimal.valueOf(year2)),
                    new ComputeRequest.CashFlowInput(3, "3년차", "2029", BigDecimal.valueOf(year3)),
                    new ComputeRequest.CashFlowInput(4, "4년차", "2030", BigDecimal.valueOf(year4)),
                    new ComputeRequest.CashFlowInput(5, "5년차", "2031", BigDecimal.valueOf(year5)));
        }

        private StockInput stockInput() {
            return new StockInput(
                    projectId() + "-EQ",
                    BigDecimal.valueOf(baseInvestmentKrw / 100_000.0).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(baseInvestmentKrw / 1_000_000.0).setScale(2, RoundingMode.HALF_UP),
                    0.04,
                    0.11);
        }

        private BondInput bondInput() {
            return new BondInput(
                    projectId() + "-BOND",
                    BigDecimal.valueOf(1000),
                    new BigDecimal("0.05"),
                    3,
                    0.042);
        }

        private DerivativeInput derivativeInput() {
            return new DerivativeInput(
                    projectId() + "-OPT",
                    "CALL",
                    BigDecimal.valueOf(105),
                    BigDecimal.valueOf(100),
                    1.25,
                    0.035,
                    0.24);
        }

        private CreditRiskInput creditRiskInput() {
            double leverage = 2.8 + (baseInvestmentKrw / 1_000_000_000.0);
            double coverage = 4.0 + (baseInvestmentKrw / 2_000_000_000.0);
            double volatility = 0.18 + (baseInvestmentKrw / 10_000_000_000.0);
            double debtRatio = 10.0 + (baseInvestmentKrw / 50_000_000_000.0);
            return new CreditRiskInput(
                    BigDecimal.valueOf(leverage).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(coverage).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(volatility).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(debtRatio).setScale(2, RoundingMode.HALF_UP));
        }
    }

    public record StockInput(
            String symbol,
            BigDecimal currentPrice,
            BigDecimal annualDividend,
            double dividendGrowthRate,
            double requiredReturnRate) {}

    public record StockValuationResult(
            String symbol,
            BigDecimal currentPrice,
            BigDecimal fairValue,
            BigDecimal upsidePercent,
            BigDecimal dividendYield) {}

    public record BondInput(
            String bondCode,
            BigDecimal faceValue,
            BigDecimal couponRate,
            int yearsToMaturity,
            double yieldToMaturity) {}

    public record BondValuationResult(
            String bondCode,
            BigDecimal price,
            BigDecimal macaulayDurationYears,
            BigDecimal modifiedDurationYears,
            BigDecimal convexity) {}

    public record DerivativeInput(
            String contractCode,
            String type,
            BigDecimal underlyingPrice,
            BigDecimal strikePrice,
            double timeToExpiryYears,
            double riskFreeRate,
            double volatility) {}

    public record DerivativeValuationResult(
            String contractCode,
            String type,
            BigDecimal fairValue,
            BigDecimal intrinsicValue,
            BigDecimal timeValue) {}

    public record RiskMetricsResult(
            BigDecimal meanValue,
            BigDecimal standardDeviation,
            BigDecimal var95,
            BigDecimal var99,
            BigDecimal expectedShortfall95) {}

    public record CreditRiskInput(
            BigDecimal leverage,
            BigDecimal debtServiceCoverage,
            BigDecimal volatility,
            BigDecimal debtRatio) {}

    public record CreditRiskResult(BigDecimal score, String ratingBand) {}
}
