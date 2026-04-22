package com.costwise.service;

import com.costwise.api.dto.ComputeRequest;
import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.api.dto.ValuationRiskResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ValuationRiskService {

    private final DcfValuationService dcfValuationService;
    private final PortfolioSummaryService portfolioSummaryService;

    public ValuationRiskService(
            DcfValuationService dcfValuationService, PortfolioSummaryService portfolioSummaryService) {
        this.dcfValuationService = dcfValuationService;
        this.portfolioSummaryService = portfolioSummaryService;
    }

    public StockValuationResult valueStock(StockInput input) {
        // Gordon growth keeps the stock example deterministic while still exposing fair value and upside.
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
        // Annual coupon math is enough for the MVP because the requirement is to show price, duration and convexity.
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
        String normalizedType = input.type().toUpperCase(Locale.ROOT);
        double s = input.underlyingPrice().doubleValue();
        double k = input.strikePrice().doubleValue();
        double t = input.timeToExpiryYears();
        double r = input.riskFreeRate();
        double sigma = input.volatility();

        double sqrtT = Math.sqrt(t);
        double d1 = (Math.log(s / k) + (r + (sigma * sigma) / 2.0) * t) / (sigma * sqrtT);
        double d2 = d1 - sigma * sqrtT;
        boolean put = "PUT".equals(normalizedType);
        double fairValue =
                put
                        ? k * Math.exp(-r * t) * normalCdf(-d2) - s * normalCdf(-d1)
                        : s * normalCdf(d1) - k * Math.exp(-r * t) * normalCdf(d2);
        double intrinsicValue = put ? Math.max(0.0, k - s) : Math.max(0.0, s - k);
        double timeValue = fairValue - intrinsicValue;

        return new DerivativeValuationResult(
                input.contractCode(),
                normalizedType,
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
        ProjectProfile profile = projectProfile(projectId);

        List<ComputeRequest.CashFlowInput> cashFlows = profile.cashFlows();
        BigDecimal riskPremium = profile.riskPremium();
        BigDecimal discountRate = BigDecimal.valueOf(0.085).add(riskPremium);
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
        List<ValuationRiskResponse.ScenarioAssumption> scenarioAssumptions = List.of(
                new ValuationRiskResponse.ScenarioAssumption(
                        "낙관",
                        scale(scenarioValues.get(0)),
                        BigDecimal.valueOf(0.20),
                        "시장 성장률과 전환율이 목표 대비 상회"),
                new ValuationRiskResponse.ScenarioAssumption(
                        "기준",
                        scale(scenarioValues.get(1)),
                        BigDecimal.valueOf(0.45),
                        "현재 사업계획 기준 현금흐름 유지"),
                new ValuationRiskResponse.ScenarioAssumption(
                        "보수",
                        scale(scenarioValues.get(2)),
                        BigDecimal.valueOf(0.20),
                        "비용 상승과 매출 지연을 반영"),
                new ValuationRiskResponse.ScenarioAssumption(
                        "스트레스",
                        scale(scenarioValues.get(3)),
                        BigDecimal.valueOf(0.10),
                        "규제/시장 충격 시나리오"),
                new ValuationRiskResponse.ScenarioAssumption(
                        "최악",
                        scale(scenarioValues.get(4)),
                        BigDecimal.valueOf(0.05),
                        "대체 투자안 전환 필요 구간"));
        RiskMetricsResult riskMetrics = calculateRiskMetrics(scenarioValues);
        CreditRiskResult creditRisk = assessCreditRisk(profile.creditRiskInput());

        return new ValuationRiskResponse(
                profile.projectId(),
                profile.projectName(),
                projectValuation,
                new ValuationRiskResponse.ValuationBasis(
                        scale(discountRate),
                        scale(riskPremium),
                        profile.headquarterCode(),
                        profile.interpretation(),
                        scenarioAssumptions),
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

    private ProjectProfile projectProfile(String projectId) {
        PortfolioSummaryResponse.ProjectSummary project =
                portfolioSummaryService.loadPortfolioSummary().projects().stream()
                        .filter(candidate -> candidate.projectId().equals(projectId) || candidate.code().equals(projectId))
                        .findFirst()
                        .orElseThrow(() -> new IllegalArgumentException("Unknown project id: " + projectId));

        return new ProjectProfile(
                project.projectId(),
                project.name(),
                project.headquarter(),
                project.investmentKrw(),
                project.risk());
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
            long baseInvestmentKrw,
            String riskLevel) {

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
            double volatility = 0.18 + (baseInvestmentKrw / 10_000_000_000.0) + riskPremium().doubleValue();
            double debtRatio = 10.0 + (baseInvestmentKrw / 50_000_000_000.0);
            return new CreditRiskInput(
                    BigDecimal.valueOf(leverage).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(coverage).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(volatility).setScale(2, RoundingMode.HALF_UP),
                    BigDecimal.valueOf(debtRatio).setScale(2, RoundingMode.HALF_UP));
        }

        private BigDecimal riskPremium() {
            return switch (riskLevel) {
                case "높음" -> new BigDecimal("0.08");
                case "중간" -> new BigDecimal("0.04");
                default -> new BigDecimal("0.01");
            };
        }

        private String headquarterCode() {
            return switch (headquarter) {
                case "언더라이팅본부" -> "UND";
                case "상품개발본부" -> "PROD";
                case "영업본부" -> "SALES";
                case "IT본부" -> "IT";
                default -> "CORP";
            };
        }

        private String interpretation() {
            return switch (riskLevel) {
                case "높음" -> "현금흐름 변동성이 높아 보수적 할인율과 하방 시나리오를 우선 검토";
                case "중간" -> "기준 시나리오 중심으로 승인 조건을 검토하되 하방 보호장치 필요";
                default -> "현금흐름 안정 구간으로 기준 시나리오 중심 의사결정 가능";
            };
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
