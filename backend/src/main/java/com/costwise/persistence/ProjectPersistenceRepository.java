package com.costwise.persistence;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ProjectPersistenceRepository {

    ProjectRecord createProject(NewProject project);

    ProjectRecord updateProject(ProjectUpdate project);

    void deleteProject(String projectId);

    Optional<ProjectRecord> findProject(String projectId);

    List<ProjectRecord> listProjects();

    boolean existsProjectCode(String code);

    ScenarioRecord createScenario(String projectId, NewScenario scenario);

    ScenarioRecord updateScenario(String projectId, ScenarioUpdate scenario);

    void deleteScenario(String projectId, String scenarioId);

    Optional<ScenarioRecord> findScenario(String projectId, String scenarioId);

    List<ScenarioRecord> listScenarios(String projectId);

    boolean existsScenarioName(String projectId, String normalizedName, String skipScenarioId);

    void upsertAnalysis(String projectId, String scenarioId, AnalysisRecord analysis, ApprovalLogRecord approvalLog);

    AnalysisRecord findAnalysis(String projectId, String scenarioId);

    List<ApprovalLogRecord> listApprovalLogs(String projectId);

    record NewProject(String code, String name, String businessType, String status, String description) {}

    record ProjectUpdate(
            String id,
            String name,
            String businessType,
            String status,
            String description) {}

    record ProjectRecord(
            String id,
            String code,
            String name,
            String businessType,
            String status,
            String description,
            LocalDateTime createdAt) {}

    record NewScenario(String name, String description, boolean isBaseline, boolean isActive) {}

    record ScenarioUpdate(
            String id,
            String name,
            String description,
            boolean isBaseline,
            boolean isActive) {}

    record ScenarioRecord(
            String id,
            String name,
            String description,
            boolean isBaseline,
            boolean isActive,
            LocalDateTime createdAt) {}

    record AnalysisRecord(
            List<AllocationRuleRecord> allocationRules,
            List<CashFlowRecord> cashFlows,
            ValuationRecord valuation) {

        static AnalysisRecord empty() {
            return new AnalysisRecord(List.of(), List.of(), null);
        }
    }

    record AllocationRuleRecord(
            String departmentCode,
            String basis,
            BigDecimal allocationRate,
            BigDecimal allocatedAmount,
            String costPoolName,
            String costPoolCategory,
            BigDecimal costPoolAmount) {}

    record CashFlowRecord(
            int periodNo,
            String periodLabel,
            String yearLabel,
            BigDecimal operatingCashFlow,
            BigDecimal investmentCashFlow,
            BigDecimal financingCashFlow,
            BigDecimal netCashFlow,
            BigDecimal discountRate) {}

    record ValuationRecord(
            BigDecimal discountRate,
            BigDecimal npv,
            BigDecimal irr,
            BigDecimal paybackPeriod,
            String decision,
            JsonNode assumptions) {}

    record ApprovalLogRecord(
            String actorRole,
            String actorName,
            String action,
            String comment,
            LocalDateTime createdAt) {}
}
