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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
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

    private final ProjectPersistenceRepository projectRepository;
    private final Map<String, ScenarioAnalysisState> scenarioAnalyses = new ConcurrentHashMap<>();
    private final Map<String, ApprovalSummaryState> approvalSummaries = new ConcurrentHashMap<>();
    private final Map<String, List<ApprovalLog>> approvalLogs = new ConcurrentHashMap<>();

    public PersistenceService(ProjectPersistenceRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ProjectSummaryResponse createProject(CreateProjectRequest request) {
        String code = request.code().trim();
        if (projectRepository.existsProjectCode(code)) {
            throw new IllegalArgumentException("Project code already exists: " + code);
        }
        ProjectPersistenceRepository.ProjectRecord project = projectRepository.createProject(
                new ProjectPersistenceRepository.NewProject(
                        code,
                        request.name().trim(),
                        request.businessType().trim(),
                        "draft",
                        request.description()));
        approvalSummaries.put(project.id(), createdApprovalSummary(project.status(), project.createdAt()));
        return toProjectSummary(project);
    }

    public ProjectSummaryResponse updateProject(String projectId, UpdateProjectRequest request) {
        ProjectPersistenceRepository.ProjectRecord currentProject = getProjectState(projectId);
        String status = normalizeEnum(request.status(), PROJECT_STATUSES, "project status");
        ProjectPersistenceRepository.ProjectRecord project = projectRepository.updateProject(
                new ProjectPersistenceRepository.ProjectUpdate(
                        projectId,
                        request.name().trim(),
                        request.businessType().trim(),
                        status,
                        request.description()));
        ApprovalSummaryState approvalSummary = approvalSummaries.computeIfAbsent(
                projectId,
                ignored -> createdApprovalSummary(currentProject.status(), currentProject.createdAt()));
        approvalSummary.status = status;
        approvalSummary.updatedAt = LocalDateTime.now();
        return toProjectSummary(project);
    }

    public void deleteProject(String projectId) {
        projectRepository.deleteProject(projectId);
        approvalSummaries.remove(projectId);
        approvalLogs.remove(projectId);
        scenarioAnalyses.keySet().removeIf(key -> key.startsWith(projectId + ":"));
    }

    public ScenarioResponse createScenario(String projectId, CreateScenarioRequest request) {
        getProjectState(projectId);
        ensureScenarioNameUnique(projectId, request.name(), null);
        ProjectPersistenceRepository.ScenarioRecord scenario = projectRepository.createScenario(
                projectId,
                new ProjectPersistenceRepository.NewScenario(
                        request.name().trim(),
                        request.description(),
                        request.isBaseline(),
                        request.isActive()));
        return toScenarioResponse(scenario);
    }

    public ScenarioResponse updateScenario(
            String projectId, String scenarioId, UpdateScenarioRequest request) {
        getProjectState(projectId);
        getScenarioState(projectId, scenarioId);
        ensureScenarioNameUnique(projectId, request.name(), scenarioId);
        ProjectPersistenceRepository.ScenarioRecord scenario = projectRepository.updateScenario(
                projectId,
                new ProjectPersistenceRepository.ScenarioUpdate(
                        scenarioId,
                        request.name().trim(),
                        request.description(),
                        request.isBaseline(),
                        request.isActive()));
        return toScenarioResponse(scenario);
    }

    public void deleteScenario(String projectId, String scenarioId) {
        getProjectState(projectId);
        projectRepository.deleteScenario(projectId, scenarioId);
        scenarioAnalyses.remove(analysisKey(projectId, scenarioId));
    }

    public AnalysisUpdateResponse upsertAnalysis(
            String projectId, String scenarioId, AnalysisUpsertRequest request) {
        ProjectPersistenceRepository.ProjectRecord project = getProjectState(projectId);
        getScenarioState(projectId, scenarioId);

        ScenarioAnalysisState analysis = new ScenarioAnalysisState(
                request.allocationRules().stream()
                        .map(this::toAllocationRule)
                        .toList(),
                request.cashFlows().stream()
                        .map(this::toCashFlow)
                        .toList(),
                toValuation(request.valuation()));
        scenarioAnalyses.put(analysisKey(projectId, scenarioId), analysis);

        ApprovalLog approvalLog = toApprovalLog(request.approval());
        String projectStatus = normalizeEnum(
                request.approval().projectStatus(), PROJECT_STATUSES, "project status");
        projectRepository.updateProject(new ProjectPersistenceRepository.ProjectUpdate(
                projectId,
                project.name(),
                project.businessType(),
                projectStatus,
                project.description()));
        ApprovalSummaryState approvalSummary = approvalSummaries.computeIfAbsent(
                projectId,
                ignored -> createdApprovalSummary(project.status(), project.createdAt()));
        approvalSummary.status = projectStatus;
        approvalSummary.lastAction = approvalLog.action;
        approvalSummary.lastActor = approvalLog.actorName;
        approvalSummary.lastComment = approvalLog.comment;
        approvalSummary.updatedAt = approvalLog.createdAt;
        approvalLogs.computeIfAbsent(projectId, ignored -> new ArrayList<>()).add(approvalLog);

        return new AnalysisUpdateResponse(projectId, scenarioId, analysis.allocationRules.size(), analysis.cashFlows.size());
    }

    public ProjectDetailResponse getProjectDetail(String projectId) {
        ProjectPersistenceRepository.ProjectRecord project = getProjectState(projectId);
        List<ProjectDetailResponse.ScenarioDetailResponse> scenarios = projectRepository.listScenarios(projectId).stream()
                .map(scenario -> toScenarioDetailResponse(projectId, scenario))
                .toList();
        List<ProjectDetailResponse.ApprovalEvent> logs = approvalLogs
                .getOrDefault(projectId, List.of())
                .stream()
                .map(log -> new ProjectDetailResponse.ApprovalEvent(
                        log.actorRole, log.actorName, log.action, log.comment, log.createdAt))
                .toList();
        ApprovalSummaryState approvalSummaryState = approvalSummaries.computeIfAbsent(
                projectId,
                ignored -> createdApprovalSummary(project.status(), project.createdAt()));
        ProjectDetailResponse.ApprovalSummary approvalSummary = new ProjectDetailResponse.ApprovalSummary(
                approvalSummaryState.status,
                approvalSummaryState.lastAction,
                approvalSummaryState.lastActor,
                approvalSummaryState.lastComment,
                approvalSummaryState.updatedAt,
                logs);
        return new ProjectDetailResponse(
                project.id(),
                project.code(),
                project.name(),
                project.businessType(),
                project.status(),
                project.description(),
                project.createdAt(),
                scenarios,
                approvalSummary);
    }

    private ProjectSummaryResponse toProjectSummary(ProjectPersistenceRepository.ProjectRecord project) {
        return new ProjectSummaryResponse(
                project.id(),
                project.code(),
                project.name(),
                project.businessType(),
                project.status(),
                project.description(),
                project.createdAt());
    }

    private ScenarioResponse toScenarioResponse(ProjectPersistenceRepository.ScenarioRecord scenario) {
        return new ScenarioResponse(
                scenario.id(),
                scenario.name(),
                scenario.description(),
                scenario.isBaseline(),
                scenario.isActive(),
                scenario.createdAt());
    }

    private ProjectDetailResponse.ScenarioDetailResponse toScenarioDetailResponse(
            String projectId, ProjectPersistenceRepository.ScenarioRecord scenario) {
        ScenarioAnalysisState analysis = scenarioAnalyses.getOrDefault(
                analysisKey(projectId, scenario.id()),
                ScenarioAnalysisState.empty());
        List<ProjectDetailResponse.AllocationRule> allocations = analysis.allocationRules.stream()
                .map(value -> new ProjectDetailResponse.AllocationRule(
                        value.departmentCode,
                        value.basis,
                        value.allocationRate,
                        value.allocatedAmount,
                        value.costPoolName,
                        value.costPoolCategory,
                        value.costPoolAmount))
                .toList();
        List<ProjectDetailResponse.CashFlow> cashFlows = analysis.cashFlows.stream()
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
        ProjectDetailResponse.Valuation valuation = analysis.valuation == null
                ? null
                : new ProjectDetailResponse.Valuation(
                        analysis.valuation.discountRate,
                        analysis.valuation.npv,
                        analysis.valuation.irr,
                        analysis.valuation.paybackPeriod,
                        analysis.valuation.decision,
                        analysis.valuation.assumptions);
        return new ProjectDetailResponse.ScenarioDetailResponse(
                scenario.id(),
                scenario.name(),
                scenario.description(),
                scenario.isBaseline(),
                scenario.isActive(),
                scenario.createdAt(),
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

    private ProjectPersistenceRepository.ProjectRecord getProjectState(String projectId) {
        return projectRepository.findProject(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown project id: " + projectId));
    }

    private ProjectPersistenceRepository.ScenarioRecord getScenarioState(String projectId, String scenarioId) {
        return projectRepository.findScenario(projectId, scenarioId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown scenario id: " + scenarioId));
    }

    private void ensureScenarioNameUnique(String projectId, String candidateName, String skipScenarioId) {
        String normalized = candidateName.trim().toLowerCase(Locale.ROOT);
        if (projectRepository.existsScenarioName(projectId, normalized, skipScenarioId)) {
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

    private ApprovalSummaryState createdApprovalSummary(String status, LocalDateTime createdAt) {
        ApprovalSummaryState approvalSummary = new ApprovalSummaryState();
        approvalSummary.status = status;
        approvalSummary.lastAction = "created";
        approvalSummary.lastActor = "system";
        approvalSummary.lastComment = "project created";
        approvalSummary.updatedAt = createdAt;
        return approvalSummary;
    }

    private String analysisKey(String projectId, String scenarioId) {
        return projectId + ":" + scenarioId;
    }

    private record ScenarioAnalysisState(
            List<AllocationRuleState> allocationRules,
            List<CashFlowState> cashFlows,
            ValuationState valuation) {

        private static ScenarioAnalysisState empty() {
            return new ScenarioAnalysisState(List.of(), List.of(), null);
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
