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
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import com.costwise.security.DivisionScope;

@Service
public class PersistenceService {

    private static final Set<String> PROJECT_STATUSES =
            Set.of("draft", "in_review", "approved", "rejected", "archived");
    private static final Set<String> ACTOR_ROLES =
            Set.of("planner", "pm", "finance_reviewer", "accountant", "executive", "system");
    private static final Map<String, String> ACTOR_ROLE_ALIASES =
            Map.of("pm", "planner", "accountant", "finance_reviewer");
    private static final Set<String> APPROVAL_ACTIONS =
            Set.of("created", "allocated", "evaluated", "approved", "rejected", "commented");
    private static final Set<String> COST_POOL_CATEGORIES =
            Set.of("personnel", "it", "vendor", "shared", "other");
    private static final Set<String> ALLOCATION_BASIS =
            Set.of("headcount", "transaction_count", "revenue", "manual");
    private static final Set<String> VALUATION_DECISIONS =
            Set.of("recommend", "review", "reject");

    private final ProjectPersistenceRepository projectRepository;

    public PersistenceService(ProjectPersistenceRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public ProjectSummaryResponse createProject(CreateProjectRequest request) {
        String businessType = request.businessType().trim();
        ensureBusinessTypeAccess(businessType);
        String code = request.code().trim();
        if (projectRepository.existsProjectCode(code)) {
            throw new IllegalArgumentException("Project code already exists: " + code);
        }
        ProjectPersistenceRepository.ProjectRecord project = projectRepository.createProject(
                new ProjectPersistenceRepository.NewProject(
                        code,
                        request.name().trim(),
                        businessType,
                        "draft",
                        request.description()));
        return toProjectSummary(project);
    }

    public ProjectSummaryResponse updateProject(String projectId, UpdateProjectRequest request) {
        getProjectState(projectId);
        String businessType = request.businessType().trim();
        ensureBusinessTypeAccess(businessType);
        String status = normalizeEnum(request.status(), PROJECT_STATUSES, "project status");
        ProjectPersistenceRepository.ProjectRecord project = projectRepository.updateProject(
                new ProjectPersistenceRepository.ProjectUpdate(
                        projectId,
                        request.name().trim(),
                        businessType,
                        status,
                        request.description()));
        return toProjectSummary(project);
    }

    public void deleteProject(String projectId) {
        projectRepository.deleteProject(projectId);
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
    }

    public AnalysisUpdateResponse upsertAnalysis(
            String projectId, String scenarioId, AnalysisUpsertRequest request) {
        ProjectPersistenceRepository.ProjectRecord project = getProjectState(projectId);
        getScenarioState(projectId, scenarioId);

        ProjectPersistenceRepository.AnalysisRecord analysis = new ProjectPersistenceRepository.AnalysisRecord(
                request.allocationRules().stream()
                        .map(this::toAllocationRule)
                        .toList(),
                request.cashFlows().stream()
                        .map(this::toCashFlow)
                        .toList(),
                toValuation(request.valuation()));

        ProjectPersistenceRepository.ApprovalLogRecord approvalLog = toApprovalLog(request.approval());
        String projectStatus = normalizeEnum(
                request.approval().projectStatus(), PROJECT_STATUSES, "project status");
        projectRepository.updateProject(new ProjectPersistenceRepository.ProjectUpdate(
                projectId,
                project.name(),
                project.businessType(),
                projectStatus,
                project.description()));
        projectRepository.upsertAnalysis(projectId, scenarioId, analysis, approvalLog);

        return new AnalysisUpdateResponse(
                projectId, scenarioId, analysis.allocationRules().size(), analysis.cashFlows().size());
    }

    public ProjectDetailResponse getProjectDetail(String projectId) {
        ProjectPersistenceRepository.ProjectRecord project = getProjectState(projectId);
        List<ProjectDetailResponse.ScenarioDetailResponse> scenarios = projectRepository.listScenarios(projectId).stream()
                .map(scenario -> toScenarioDetailResponse(projectId, scenario))
                .toList();
        List<ProjectPersistenceRepository.ApprovalLogRecord> storedLogs = projectRepository.listApprovalLogs(projectId);
        List<ProjectDetailResponse.ApprovalEvent> logs = storedLogs.stream()
                .map(log -> new ProjectDetailResponse.ApprovalEvent(
                        log.actorRole(), log.actorName(), log.action(), log.comment(), log.createdAt()))
                .toList();
        ProjectPersistenceRepository.ApprovalLogRecord latestApproval =
                storedLogs.isEmpty() ? null : storedLogs.getLast();
        ProjectDetailResponse.ApprovalSummary approvalSummary = new ProjectDetailResponse.ApprovalSummary(
                project.status(),
                latestApproval == null ? "created" : latestApproval.action(),
                latestApproval == null ? "system" : latestApproval.actorName(),
                latestApproval == null ? "project created" : latestApproval.comment(),
                latestApproval == null ? project.createdAt() : latestApproval.createdAt(),
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

    public void assertProjectAccess(String projectReference) {
        DivisionScope scope = DivisionScope.current();
        if (!scope.isRestricted()) {
            return;
        }

        Optional<ProjectPersistenceRepository.ProjectRecord> project = resolveProjectByIdOrCode(projectReference);
        if (project.isPresent()) {
            ensureProjectAccess(project.get(), projectReference);
            return;
        }

        if (!scope.allowsProjectReference(projectReference)) {
            throw new AccessDeniedException("Project is outside division scope: " + projectReference);
        }
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
        ProjectPersistenceRepository.AnalysisRecord analysis = projectRepository.findAnalysis(projectId, scenario.id());
        List<ProjectDetailResponse.AllocationRule> allocations = analysis.allocationRules().stream()
                .map(value -> new ProjectDetailResponse.AllocationRule(
                        value.departmentCode(),
                        value.basis(),
                        value.allocationRate(),
                        value.allocatedAmount(),
                        value.costPoolName(),
                        value.costPoolCategory(),
                        value.costPoolAmount()))
                .toList();
        List<ProjectDetailResponse.CashFlow> cashFlows = analysis.cashFlows().stream()
                .map(value -> new ProjectDetailResponse.CashFlow(
                        value.periodNo(),
                        value.periodLabel(),
                        value.yearLabel(),
                        value.operatingCashFlow(),
                        value.investmentCashFlow(),
                        value.financingCashFlow(),
                        value.netCashFlow(),
                        value.discountRate()))
                .toList();
        ProjectDetailResponse.Valuation valuation = analysis.valuation() == null
                ? null
                : new ProjectDetailResponse.Valuation(
                        analysis.valuation().discountRate(),
                        analysis.valuation().npv(),
                        analysis.valuation().irr(),
                        analysis.valuation().paybackPeriod(),
                        analysis.valuation().decision(),
                        analysis.valuation().assumptions());
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

    private ProjectPersistenceRepository.AllocationRuleRecord toAllocationRule(
            AnalysisUpsertRequest.AllocationRuleInput input) {
        String basis = normalizeEnum(input.basis(), ALLOCATION_BASIS, "allocation basis");
        String costPoolCategory = normalizeEnum(input.costPoolCategory(), COST_POOL_CATEGORIES, "cost pool category");
        if (input.allocationRate().compareTo(BigDecimal.ZERO) < 0 || input.allocationRate().compareTo(BigDecimal.ONE) > 0) {
            throw new IllegalArgumentException("allocationRate must be between 0 and 1");
        }
        if (input.allocatedAmount().compareTo(BigDecimal.ZERO) < 0 || input.costPoolAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("allocatedAmount and costPoolAmount must be >= 0");
        }
        return new ProjectPersistenceRepository.AllocationRuleRecord(
                input.departmentCode().trim(),
                basis,
                input.allocationRate(),
                input.allocatedAmount(),
                input.costPoolName().trim(),
                costPoolCategory,
                input.costPoolAmount());
    }

    private ProjectPersistenceRepository.CashFlowRecord toCashFlow(AnalysisUpsertRequest.CashFlowInput input) {
        if (input.periodNo() < 0) {
            throw new IllegalArgumentException("periodNo must be >= 0");
        }
        if (input.discountRate().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("discountRate must be >= 0");
        }
        // Schema contract keeps net_cash_flow as stored value; this slice derives it deterministically
        // from operating + investment + financing to avoid drift between API payload and persisted shape.
        BigDecimal netCashFlow = input.operatingCashFlow().add(input.investmentCashFlow()).add(input.financingCashFlow());
        return new ProjectPersistenceRepository.CashFlowRecord(
                input.periodNo(),
                input.periodLabel().trim(),
                input.yearLabel().trim(),
                input.operatingCashFlow(),
                input.investmentCashFlow(),
                input.financingCashFlow(),
                netCashFlow,
                input.discountRate());
    }

    private ProjectPersistenceRepository.ValuationRecord toValuation(AnalysisUpsertRequest.ValuationInput input) {
        String decision = normalizeEnum(input.decision(), VALUATION_DECISIONS, "valuation decision");
        if (input.discountRate().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("discountRate must be >= 0");
        }
        JsonNode assumptions = input.assumptions() == null ? JsonNodeFactory.instance.objectNode() : input.assumptions();
        return new ProjectPersistenceRepository.ValuationRecord(
                input.discountRate(),
                input.npv(),
                input.irr(),
                input.paybackPeriod(),
                decision,
                assumptions);
    }

    private ProjectPersistenceRepository.ApprovalLogRecord toApprovalLog(AnalysisUpsertRequest.ApprovalInput input) {
        String actorRole = normalizeActorRole(input.actorRole());
        String action = normalizeEnum(input.action(), APPROVAL_ACTIONS, "approval action");
        return new ProjectPersistenceRepository.ApprovalLogRecord(
                actorRole, input.actorName().trim(), action, input.comment(), LocalDateTime.now());
    }

    private ProjectPersistenceRepository.ProjectRecord getProjectState(String projectId) {
        ProjectPersistenceRepository.ProjectRecord project = projectRepository.findProject(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown project id: " + projectId));
        ensureProjectAccess(project, projectId);
        return project;
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

    private String normalizeActorRole(String value) {
        String normalized = normalizeEnum(value, ACTOR_ROLES, "actor role");
        return ACTOR_ROLE_ALIASES.getOrDefault(normalized, normalized);
    }

    private Optional<ProjectPersistenceRepository.ProjectRecord> resolveProjectByIdOrCode(String projectReference) {
        if (projectReference == null || projectReference.isBlank()) {
            return Optional.empty();
        }

        try {
            Optional<ProjectPersistenceRepository.ProjectRecord> byId = projectRepository.findProject(projectReference);
            if (byId.isPresent()) {
                return byId;
            }
        } catch (IllegalArgumentException ignored) {
            // Non-UUID project references are matched by code fallback.
        }

        String normalizedReference = projectReference.trim();
        return projectRepository.listProjects().stream()
                .filter(project -> normalizedReference.equals(project.id())
                        || normalizedReference.equalsIgnoreCase(project.code()))
                .findFirst();
    }

    private void ensureProjectAccess(ProjectPersistenceRepository.ProjectRecord project, String projectReference) {
        DivisionScope scope = DivisionScope.current();
        if (!scope.isRestricted()) {
            return;
        }
        if (scope.allowsBusinessType(project.businessType()) || scope.allowsProjectReference(project.code())) {
            return;
        }
        throw new AccessDeniedException("Project is outside division scope: " + projectReference);
    }

    private void ensureBusinessTypeAccess(String businessType) {
        DivisionScope scope = DivisionScope.current();
        if (!scope.isRestricted()) {
            return;
        }
        if (scope.allowsBusinessType(businessType)) {
            return;
        }
        throw new AccessDeniedException("Business type is outside division scope: " + businessType);
    }

}
