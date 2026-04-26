package com.costwise.api.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PortfolioSummaryResponse(
        String portfolioName,
        String owner,
        String status,
        String risk,
        Overview overview,
        List<HeadquarterSummary> headquarters,
        List<ProjectSummary> projects,
        List<Assumption> assumptions,
        List<AuditEvent> auditEvents) {

    public record Overview(
            int headquarterCount,
            int projectCount,
            long totalInvestmentKrw,
            long totalExpectedRevenueKrw,
            long averageNpvKrw,
            double averageIrr,
            double averagePaybackYears,
            int approvedCount,
            int conditionalCount) {}

    public record HeadquarterSummary(
            String code,
            String name,
            int projectCount,
            long totalInvestmentKrw,
            long totalExpectedRevenueKrw,
            long averageNpvKrw,
            String risk,
            String priorityProject) {}

    public record ProjectSummary(
            String projectId,
            int rank,
            String code,
            String name,
            String headquarter,
            long investmentKrw,
            long expectedRevenueKrw,
            long npvKrw,
            double irr,
            double paybackYears,
            String status,
            String risk) {}

    public record Assumption(String label, String value) {}

    public record AuditEvent(
            String actor,
            String action,
            String domain,
            LocalDateTime at) {}
}
