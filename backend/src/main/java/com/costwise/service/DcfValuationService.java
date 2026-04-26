package com.costwise.service;

import com.costwise.api.dto.ComputeRequest;
import com.costwise.api.dto.ComputeResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DcfValuationService {

    public DcfResult evaluate(List<ComputeRequest.CashFlowInput> cashFlows, BigDecimal discountRate) {
        List<ComputeRequest.CashFlowInput> orderedCashFlows =
                cashFlows.stream().sorted(Comparator.comparingInt(ComputeRequest.CashFlowInput::periodNo)).toList();

        List<ComputeResponse.CashFlowProjection> projections = new ArrayList<>();
        double rate = discountRate.doubleValue();
        double cumulativeCashFlow = 0.0;
        double npv = 0.0;
        double[] amounts = new double[orderedCashFlows.size()];

        for (int index = 0; index < orderedCashFlows.size(); index++) {
            ComputeRequest.CashFlowInput cashFlow = orderedCashFlows.get(index);
            double amount = cashFlow.netCashFlow().doubleValue();
            amounts[index] = amount;

            double discounted = amount / Math.pow(1.0 + rate, cashFlow.periodNo());
            cumulativeCashFlow += amount;
            npv += discounted;

            projections.add(
                    new ComputeResponse.CashFlowProjection(
                            cashFlow.periodNo(),
                            cashFlow.periodLabel(),
                            cashFlow.yearLabel(),
                            cashFlow.netCashFlow().setScale(2, RoundingMode.HALF_UP),
                            BigDecimal.valueOf(discounted).setScale(2, RoundingMode.HALF_UP),
                            BigDecimal.valueOf(cumulativeCashFlow).setScale(2, RoundingMode.HALF_UP)));
        }

        Double irr = solveIrr(amounts);
        Double paybackPeriodYears = calculatePaybackPeriodYears(orderedCashFlows);

        return new DcfResult(
                BigDecimal.valueOf(npv).setScale(2, RoundingMode.HALF_UP),
                irr == null ? null : round(irr, 6),
                paybackPeriodYears == null ? null : round(paybackPeriodYears, 2),
                projections);
    }

    public record DcfResult(
            BigDecimal npv,
            Double irr,
            Double paybackPeriodYears,
            List<ComputeResponse.CashFlowProjection> projections) {}

    private Double solveIrr(double[] cashFlows) {
        boolean hasPositive = false;
        boolean hasNegative = false;
        for (double cashFlow : cashFlows) {
            if (cashFlow > 0) {
                hasPositive = true;
            }
            if (cashFlow < 0) {
                hasNegative = true;
            }
        }

        if (!hasPositive || !hasNegative) {
            return null;
        }

        double guess = 0.1;
        for (int iteration = 0; iteration < 100; iteration++) {
            double npv = 0.0;
            double derivative = 0.0;

            for (int period = 0; period < cashFlows.length; period++) {
                double discountFactor = Math.pow(1.0 + guess, period);
                npv += cashFlows[period] / discountFactor;

                if (period > 0) {
                    derivative -= period * cashFlows[period] / (discountFactor * (1.0 + guess));
                }
            }

            if (Math.abs(npv) < 1e-9) {
                return guess;
            }

            if (Math.abs(derivative) < 1e-9) {
                return null;
            }

            double nextGuess = guess - (npv / derivative);
            if (Double.isNaN(nextGuess) || Double.isInfinite(nextGuess) || nextGuess <= -0.9999) {
                return null;
            }

            if (Math.abs(nextGuess - guess) < 1e-9) {
                return nextGuess;
            }

            guess = nextGuess;
        }

        return guess;
    }

    private Double calculatePaybackPeriodYears(List<ComputeRequest.CashFlowInput> cashFlows) {
        double cumulative = 0.0;
        ComputeRequest.CashFlowInput previous = null;

        for (ComputeRequest.CashFlowInput cashFlow : cashFlows) {
            cumulative += cashFlow.netCashFlow().doubleValue();
            if (cumulative >= 0.0) {
                if (previous == null) {
                    return 0.0;
                }

                double previousCumulative =
                        cumulative - cashFlow.netCashFlow().doubleValue();
                double amountInCurrentPeriod = cashFlow.netCashFlow().doubleValue();
                if (amountInCurrentPeriod == 0.0) {
                    return (double) cashFlow.periodNo();
                }

                double fraction = (0.0 - previousCumulative) / amountInCurrentPeriod;
                return previous.periodNo() + fraction;
            }

            previous = cashFlow;
        }

        return null;
    }

    private static double round(double value, int scale) {
        double factor = Math.pow(10.0, scale);
        return Math.round(value * factor) / factor;
    }
}
