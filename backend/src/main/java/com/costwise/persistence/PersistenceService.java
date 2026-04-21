package com.costwise.persistence;

import com.costwise.api.dto.persistence.AnalysisUpdateResponse;
import com.costwise.api.dto.persistence.AnalysisUpsertRequest;
import com.costwise.api.dto.persistence.CreateProjectRequest;
import com.costwise.api.dto.persistence.CreateScenarioRequest;
import com.costwise.api.dto.persistence.ProjectDetailResponse;
import com.costwise.api.dto.persistence.ProjectSummaryResponse;
import com.costwise.api.dto.persistence.ScenarioResponse;
import com.costwise.api.dto.persistence.UpdateProjectRequest;
import com.costwise.api.dto.persistence.UpdateScenarioRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class PersistenceService {

    private static final Set<String> PROJECT_STATUSES =
            Set.of("draft", "in_review", "approved", "rejected", "archived");
    private static final Set<String> ACTOR_ROLES =
            Set.of("planner", "finance_reviewer", "executive", "system");
    private static final Set<String> APPROVAL_ACTIONS =
            Set.of("created", "allocated", "evaluated", "approved", "rejected", "commented");
    private static final Set<String> COST_POOL_CATEGORIES =
            Set.of("personnel", "it", "vendor", "shared", "other");
    private static final Set<String> ALLOCATION_BASIS =
            Set.of("headcount", "transaction_count", "revenue", "manual");
    private static final Set<String> VALUATION_DECISIONS =
            Set.of("recommend", "review", "reject");

    private final Map<String, ProjectState> projects = new ConcurrentHashMap<>();
    private final Map<String, String> codeToProjectId = new ConcurrentHashMap<>();

    public ProjectSummaryResponse createProject(CreateProjectRequest request) {
        String code = request.code().trim();
        if (codeToProjectId.containsKey(code)) {
            throw new IllegalArgumentException("Project code already exists: " + code);
        }
        String id = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        ProjectState project = new ProjectState(
                id, code, request.name().trim(), request.businessType().trim(), "draft", request.description(), now);
        projects.put(id, project);
        codeToProjectId.put(code, id);
        return toProjectSummary(project);
    }

    public ProjectSummaryResponse updateProject(String projectId, UpdateProjectRequest request) {
        ProjectState project = getProjectState(projectId);
        String status = normalizeEnum(request.status(), PROJECT_STATUSES, "project status");
        project.name = request.name().trim();
        project.businessType = request.businessType().trim();
        project.description = request.description();
        project.status = status;
        project.approvalSummary.status = status;
        project.approvalSummary.updatedAt = LocalDateTime.now();
        return toProjectSummary(project);
    }

    public void deleteProject(String projectId) {
        ProjectState removed = projects.remove(projectId);
        if (removed == null) {
            throw new IllegalArgumentException("Unknown project id: " + projectId);
        }
        codeToProjectId.remove(removed.code);
    }

    public ScenarioResponse createScenario(String projectId, CreateScenarioRequest request) {
        ProjectState project = getProjectState(projectId);
        ensureScenarioNameUnique(project, request.name(), null);
        ScenarioState scenario = new ScenarioState(
                UUID.randomUUID().toString(),
                request.name().trim(),
                request.description(),
                request.isBaseline(),
                request.isActive(),
                LocalDateTime.now());
        project.scenarios.put(scenario.id, scenario);
        return toScenarioResponse(scenario);
    }

    public ScenarioResponse updateScenario(
            String projectId, String scenarioId, UpdateScenarioRequest request) {
        ProjectState project = getProjectState(projectId);
        ScenarioState scenario = getScenarioState(project, scenarioId);
        ensureScenarioNameUnique(project, request.name(), scenarioId);
        scenario.name = request.name().trim();
        scenario.description = request.description();
        scenario.isBaseline = request.isBaseline();
        scenario.isActive = request.isActive();
        return toScenarioResponse(scenario);
    }

    public void deleteScenario(String projectId, String scenarioId) {
        ProjectState project = getProjectState(projectId);
        ScenarioState removed = project.scenarios.remove(scenarioId);
        if (removed == null) {
            throw new IllegalArgumentException("Unknown scenario id: " + scenarioId);
        }
    }

    public AnalysisUpdateResponse upsertAnalysis(
            String projectId, String scenarioId, AnalysisUpsertRequest request) {
        ProjectState project = getProjectState(projectId);
        ScenarioState scenario = getScenarioState(project, scenarioId);

        scenario.allocationRules = request.allocationRules().stream()
                .map(this::toAllocationRule)
                .toList();
        scenario.cashFlows = request.cashFlows().stream()
                .map(this::toCashFlow)
                .toList();
        scenario.valuation = toValuation(request.valuation());

        ApprovalLog approvalLog = toApprovalLog(request.approval());
        project.approvalSummary.status = normalizeEnum(
                request.approval().projectStatus(), PROJECT_STATUSES, "project status");
        project.approvalSummary.lastAction = approvalLog.action;
        project.approvalSummary.lastActor = approvalLog.actorName;
        project.approvalSummary.lastComment = approvalLog.comment;
        project.approvalSummary.updatedAt = approvalLog.createdAt;
        project.approvalLogs.add(approvalLog);
        project.status = project.approvalSummary.status;

        return new AnalysisUpdateResponse(projectId, scenarioId, scenario.allocationRules.size(), scenario.cashFlows.size());
    }

    public ProjectDetailResponse getProjectDetail(String projectId) {
        ProjectState project = getProjectState(projectId);
        List<ProjectDetailResponse.ScenarioDetailResponse> scenarios = project.scenarios.values().stream()
                .map(this::toScenarioDetailResponse)
                .toList();
        List<ProjectDetailResponse.ApprovalEvent> logs = project.approvalLogs.stream()
                .map(log -> new ProjectDetailResponse.ApprovalEvent(
                        log.actorRole, log.actorName, log.action, log.comment, log.createdAt))
                .toList();
        ProjectDetailResponse.ApprovalSummary approvalSummary = new ProjectDetailResponse.ApprovalSummary(
                project.approvalSummary.status,
                project.approvalSummary.lastAction,
                project.approvalSummary.lastActor,
                project.approvalSummary.lastComment,
                project.approvalSummary.updatedAt,
                logs);
        return new ProjectDetailResponse(
                project.id,
                project.code,
                project.name,
                project.businessType,
                project.status,
                project.description,
                project.createdAt,
                scenarios,
                approvalSummary);
    }

    private ProjectSummaryResponse toProjectSummary(ProjectState project) {
        return new ProjectSummaryResponse(
                project.id, project.code, project.name, project.businessType, project.status, project.description, project.createdAt);
    }

    private ScenarioResponse toScenarioResponse(ScenarioState scenario) {
        return new ScenarioResponse(
                scenario.id, scenario.name, scenario.description, scenario.isBaseline, scenario.isActive, scenario.createdAt);
    }

    private ProjectDetailResponse.ScenarioDetailResponse toScenarioDetailResponse(ScenarioState scenario) {
        List<ProjectDetailResponse.AllocationRule> allocations = scenario.allocationRules.stream()
                .map(value -> new ProjectDetailResponse.AllocationRule(
                        value.departmentCode,
                        value.basis,
                        value.allocationRate,
                        value.allocatedAmount,
                        value.costPoolName,
                        value.costPoolCategory,
                        value.costPoolAmount))
                .toList();
        List<ProjectDetailResponse.CashFlow> cashFlows = scenario.cashFlows.stream()
                .map(value -> new ProjectDetailResponse.CashFlow(
                        value.periodNo,
                        value.periodLabel,
                        value.yearLabel,
                        value.operatingCashFlow,
                        value.investmentCashFlow,
                        value.financingCashFlow,
                        value.netCashFlow,
                        value.discountRate))
                .toList();
        ProjectDetailResponse.Valuation valuation = scenario.valuation == null
                ? null
                : new ProjectDetailResponse.Valuation(
                        scenario.valuation.discountRate,
                        scenario.valuation.npv,
                        scenario.valuation.irr,
                        scenario.valuation.paybackPeriod,
                        scenario.valuation.decision,
                        scenario.valuation.assumptions);
        return new ProjectDetailResponse.ScenarioDetailResponse(
                scenario.id,
                scenario.name,
                scenario.description,
                scenario.isBaseline,
                scenario.isActive,
                scenario.createdAt,
                allocations,
                cashFlows,
                valuation);
    }

    private AllocationRuleState toAllocationRule(AnalysisUpsertRequest.AllocationRuleInput input) {
        String basis = normalizeEnum(input.basis(), ALLOCATION_BASIS, "allocation basis");
        String costPoolCategory = normalizeEnum(input.costPoolCategory(), COST_POOL_CATEGORIES, "cost pool category");
        if (input.allocationRate().compareTo(BigDecimal.ZERO) < 0 || input.allocationRate().compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("allocationRate must be between 0 and 1");
        }
        if (input.allocatedAmount().compareTo(BigDecimal.ZERO) < 0 || input.costPoolAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("allocatedAmount and costPoolAmount must be >= 0");
        }
        return new AllocationRuleState(
                input.departmentCode().trim(),
                basis,
                input.allocationRate(),
                input.allocatedAmount(),
                input.costPoolName().trim(),
                costPoolCategory,
                input.costPoolAmount());
    }

    private CashFlowState toCashFlow(AnalysisUpsertRequest.CashFlowInput input) {
        if (input.periodNo() < 0) {
            throw new IllegalArgumentException("periodNo must be >= 0");
        }
        if (input.discountRate().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("discountRate must be >= 0");
        }
        // Schema contract keeps net_cash_flow as stored value; this slice derives it deterministically
        // from operating + investment + financing to avoid drift between API payload and persisted shape.
        BigDecimal netCashFlow = input.operatingCashFlow().add(input.investmentCashFlow()).add(input.financingCashFlow());
        return new CashFlowState(
                input.periodNo(),
                input.periodLabel().trim(),
                input.yearLabel().trim(),
                input.operatingCashFlow(),
                input.investmentCashFlow(),
                input.financingCashFlow(),
                netCashFlow,
                input.discountRate());
    }

    private ValuationState toValuation(AnalysisUpsertRequest.ValuationInput input) {
        String decision = normalizeEnum(input.decision(), VALUATION_DECISIONS, "valuation decision");
        if (input.discountRate().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("discountRate must be >= 0");
        }
        JsonNode assumptions = input.assumptions() == null ? JsonNodeFactory.instance.objectNode() : input.assumptions();
        return new ValuationState(
                input.discountRate(),
                input.npv(),
                input.irr(),
                input.paybackPeriod(),
                decision,
                assumptions);
    }

    private ApprovalLog toApprovalLog(AnalysisUpsertRequest.ApprovalInput input) {
        String actorRole = normalizeEnum(input.actorRole(), ACTOR_ROLES, "actor role");
        String action = normalizeEnum(input.action(), APPROVAL_ACTIONS, "approval action");
        return new ApprovalLog(actorRole, input.actorName().trim(), action, input.comment(), LocalDateTime.now());
    }

    private ProjectState getProjectState(String projectId) {
        ProjectState project = projects.get(projectId);
        if (project == null) {
            throw new IllegalArgumentException("Unknown project id: " + projectId);
        }
        return project;
    }

    private ScenarioState getScenarioState(ProjectState project, String scenarioId) {
        ScenarioState scenario = project.scenarios.get(scenarioId);
        if (scenario == null) {
            throw new IllegalArgumentException("Unknown scenario id: " + scenarioId);
        }
        return scenario;
    }

    private void ensureScenarioNameUnique(ProjectState project, String candidateName, String skipScenarioId) {
        String normalized = candidateName.trim().toLowerCase(Locale.ROOT);
        boolean duplicated = project.scenarios.values().stream()
                .anyMatch(s -> !s.id.equals(skipScenarioId) && s.name.trim().toLowerCase(Locale.ROOT).equals(normalized));
        if (duplicated) {
            throw new IllegalArgumentException("Scenario name already exists in project: " + candidateName);
        }
    }

    private String normalizeEnum(String value, Set<String> allowed, String fieldName) {
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if (!allowed.contains(normalized)) {
            throw new IllegalArgumentException("Invalid " + fieldName + ": " + value);
        }
        return normalized;
    }

    private static final class ProjectState {
        private final String id;
        private final String code;
        private String name;
        private String businessType;
        private String status;
        private String description;
        private final LocalDateTime createdAt;
        private final Map<String, ScenarioState> scenarios = new LinkedHashMap<>();
        private final ApprovalSummaryState approvalSummary = new ApprovalSummaryState();
        private final List<ApprovalLog> approvalLogs = new ArrayList<>();

        private ProjectState(
                String id,
                String code,
                String name,
                String businessType,
                String status,
                String description,
                LocalDateTime createdAt) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.businessType = businessType;
            this.status = status;
            this.description = description;
            this.createdAt = createdAt;
            this.approvalSummary.status = status;
            this.approvalSummary.lastAction = "created";
            this.approvalSummary.lastActor = "system";
            this.approvalSummary.lastComment = "project created";
            this.approvalSummary.updatedAt = createdAt;
        }
    }

    private static final class ScenarioState {
        private final String id;
        private String name;
        private String description;
        private boolean isBaseline;
        private boolean isActive;
        private final LocalDateTime createdAt;
        private List<AllocationRuleState> allocationRules = List.of();
        private List<CashFlowState> cashFlows = List.of();
        private ValuationState valuation;

        private ScenarioState(
                String id,
                String name,
                String description,
                boolean isBaseline,
                boolean isActive,
                LocalDateTime createdAt) {
            this.id = id;
            this.name = name;
            this.description = description;
            this.isBaseline = isBaseline;
            this.isActive = isActive;
            this.createdAt = createdAt;
        }
    }

    private record AllocationRuleState(
            String departmentCode,
            String basis,
            BigDecimal allocationRate,
            BigDecimal allocatedAmount,
            String costPoolName,
            String costPoolCategory,
            BigDecimal costPoolAmount) {}

    private record CashFlowState(
            int periodNo,
            String periodLabel,
            String yearLabel,
            BigDecimal operatingCashFlow,
            BigDecimal investmentCashFlow,
            BigDecimal financingCashFlow,
            BigDecimal netCashFlow,
            BigDecimal discountRate) {}

    private record ValuationState(
            BigDecimal discountRate,
            BigDecimal npv,
            BigDecimal irr,
            BigDecimal paybackPeriod,
            String decision,
            JsonNode assumptions) {}

    private static final class ApprovalSummaryState {
        private String status;
        private String lastAction;
        private String lastActor;
        private String lastComment;
        private LocalDateTime updatedAt;
    }

    private record ApprovalLog(
            String actorRole,
            String actorName,
            String action,
            String comment,
            LocalDateTime createdAt) {}
}
