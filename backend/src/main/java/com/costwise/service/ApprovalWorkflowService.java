package com.costwise.service;

import com.costwise.api.dto.ApprovalWorkflowResponse;
import com.costwise.api.dto.PortfolioSummaryResponse;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ApprovalWorkflowService {

    private final PortfolioSummaryService portfolioSummaryService;
    private final AuditLogService auditLogService;
    private final Map<String, WorkflowState> states = new LinkedHashMap<>();

    public ApprovalWorkflowService(
            PortfolioSummaryService portfolioSummaryService, AuditLogService auditLogService) {
        this.portfolioSummaryService = portfolioSummaryService;
        this.auditLogService = auditLogService;
        initializeStates();
    }

    public ApprovalWorkflowResponse loadWorkflow(String projectId) {
        WorkflowState state = getState(projectId);
        PortfolioSummaryResponse.ProjectSummary project = projectFor(projectId);
        return new ApprovalWorkflowResponse(
                projectId,
                project.name(),
                state.status,
                state.lastAction,
                state.updatedAt,
                auditLogService.eventsForProject(projectId));
    }

    public ApprovalWorkflowResponse transition(
            String projectId, String role, String action, String actor, String comment) {
        WorkflowState state = getState(projectId);
        WorkflowAction workflowAction = WorkflowAction.valueOf(action.toUpperCase(Locale.ROOT));
        WorkflowRole workflowRole = WorkflowRole.valueOf(role.toUpperCase(Locale.ROOT));

        if (!workflowAction.allowedRoles.contains(workflowRole)) {
            throw new IllegalArgumentException("Role " + role + " cannot perform action " + action);
        }

        if (state.status.equals("APPROVED") || state.status.equals("REJECTED")) {
            throw new IllegalArgumentException("Workflow already completed for project " + projectId);
        }

        if (workflowAction == WorkflowAction.SUBMIT && !"DRAFT".equals(state.status)) {
            throw new IllegalArgumentException("Only draft projects can be moved to review");
        }

        if ((workflowAction == WorkflowAction.APPROVE || workflowAction == WorkflowAction.REJECT)
                && !"REVIEW".equals(state.status)) {
            throw new IllegalArgumentException("Only review projects can be approved or rejected");
        }

        String nextStatus = workflowAction == WorkflowAction.COMMENT ? state.status : workflowAction.nextStatus;
        state.status = nextStatus;
        state.lastAction = workflowAction.name();
        state.updatedAt = LocalDateTime.now();

        auditLogService.record(
                projectId,
                actor,
                workflowRole.name(),
                workflowAction.name(),
                comment == null || comment.isBlank() ? workflowAction.auditLabel : comment);

        return loadWorkflow(projectId);
    }

    private void initializeStates() {
        for (PortfolioSummaryResponse.ProjectSummary project : portfolioSummaryService.loadPortfolioSummary().projects()) {
            states.putIfAbsent(project.code(), new WorkflowState(project.status().equals("승인") ? "APPROVED" : "DRAFT"));
        }
    }

    private WorkflowState getState(String projectId) {
        return states.computeIfAbsent(projectId, ignored -> new WorkflowState("DRAFT"));
    }

    private PortfolioSummaryResponse.ProjectSummary projectFor(String projectId) {
        return portfolioSummaryService.loadPortfolioSummary().projects().stream()
                .filter(project -> project.code().equals(projectId) || String.valueOf(project.rank()).equals(projectId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown project id: " + projectId));
    }

    private static final class WorkflowState {
        private String status;
        private String lastAction;
        private LocalDateTime updatedAt;

        private WorkflowState(String status) {
            this.status = status;
            this.lastAction = "INIT";
            this.updatedAt = LocalDateTime.now();
        }
    }

    private enum WorkflowRole {
        PLANNER,
        COST_MANAGER,
        FINANCE_REVIEWER,
        DIVISION_HEAD,
        EXECUTIVE
    }

    private enum WorkflowAction {
        SUBMIT("REVIEW", List.of(WorkflowRole.PLANNER, WorkflowRole.COST_MANAGER), "기획서를 검토 단계로 보냈습니다."),
        APPROVE("APPROVED", List.of(WorkflowRole.FINANCE_REVIEWER, WorkflowRole.EXECUTIVE), "승인했습니다."),
        REJECT("REJECTED", List.of(WorkflowRole.FINANCE_REVIEWER, WorkflowRole.EXECUTIVE), "반려했습니다."),
        COMMENT("REVIEW", List.of(WorkflowRole.DIVISION_HEAD, WorkflowRole.FINANCE_REVIEWER, WorkflowRole.EXECUTIVE), "코멘트를 남겼습니다.");

        private final String nextStatus;
        private final List<WorkflowRole> allowedRoles;
        private final String auditLabel;

        WorkflowAction(String nextStatus, List<WorkflowRole> allowedRoles, String auditLabel) {
            this.nextStatus = nextStatus;
            this.allowedRoles = allowedRoles;
            this.auditLabel = auditLabel;
        }
    }
}
