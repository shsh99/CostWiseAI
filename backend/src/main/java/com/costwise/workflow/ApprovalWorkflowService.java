package com.costwise.workflow;

import com.costwise.api.dto.workflow.ApprovalWorkflowResponse;
import com.costwise.audit.AuditLogService;
import com.costwise.api.dto.PortfolioSummaryResponse;
import com.costwise.persistence.WorkflowStateRepository;
import com.costwise.service.PortfolioSummaryService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class ApprovalWorkflowService {

    private final PortfolioSummaryService portfolioSummaryService;
    private final AuditLogService auditLogService;
    private final WorkflowStateRepository workflowStateRepository;

    public ApprovalWorkflowService(
            PortfolioSummaryService portfolioSummaryService,
            AuditLogService auditLogService,
            WorkflowStateRepository workflowStateRepository) {
        this.portfolioSummaryService = portfolioSummaryService;
        this.auditLogService = auditLogService;
        this.workflowStateRepository = workflowStateRepository;
    }

    public ApprovalWorkflowResponse loadWorkflow(String projectId) {
        PortfolioSummaryResponse.ProjectSummary project = projectFor(projectId);
        String canonicalProjectId = project.projectId();
        WorkflowState state = getOrCreateState(project);
        return new ApprovalWorkflowResponse(
                canonicalProjectId,
                project.name(),
                state.status,
                state.lastAction,
                state.updatedAt,
                auditLogService.eventsForProject(canonicalProjectId));
    }

    public ApprovalWorkflowResponse transition(
            String projectId, String role, String action, String actor, String comment) {
        PortfolioSummaryResponse.ProjectSummary project = projectFor(projectId);
        String canonicalProjectId = project.projectId();
        WorkflowState state = getOrCreateState(project);
        WorkflowAction workflowAction = WorkflowAction.valueOf(action.toUpperCase(Locale.ROOT));
        WorkflowRole workflowRole = WorkflowRole.valueOf(role.toUpperCase(Locale.ROOT));

        if (!workflowAction.allowedRoles.contains(workflowRole)) {
            throw new AccessDeniedException("Role " + role + " cannot perform action " + action);
        }

        if (state.status.equals("APPROVED") || state.status.equals("REJECTED")) {
            throw new IllegalArgumentException("Workflow already completed for project " + canonicalProjectId);
        }

        if (workflowAction == WorkflowAction.SUBMIT && !"DRAFT".equals(state.status)) {
            throw new IllegalArgumentException("Only draft projects can be moved to review");
        }

        if ((workflowAction == WorkflowAction.APPROVE || workflowAction == WorkflowAction.REJECT)
                && !"REVIEW".equals(state.status)) {
            throw new IllegalArgumentException("Only review projects can be approved or rejected");
        }

        String nextStatus = workflowAction == WorkflowAction.COMMENT ? state.status : workflowAction.nextStatus;
        LocalDateTime updatedAt = LocalDateTime.now();
        WorkflowState updatedState = new WorkflowState(nextStatus, workflowAction.name(), updatedAt);
        workflowStateRepository.updateState(
                canonicalProjectId,
                updatedState.status,
                updatedState.lastAction,
                updatedState.updatedAt);

        auditLogService.record(
                canonicalProjectId,
                actor,
                workflowRole.name(),
                workflowAction.name(),
                comment == null || comment.isBlank() ? workflowAction.auditLabel : comment);

        return loadWorkflow(canonicalProjectId);
    }

    private WorkflowState getOrCreateState(PortfolioSummaryResponse.ProjectSummary project) {
        String projectId = project.projectId();
        return workflowStateRepository.findState(projectId)
                .map(this::toState)
                .orElseGet(() -> createInitialState(project));
    }

    private WorkflowState createInitialState(PortfolioSummaryResponse.ProjectSummary project) {
        String initialStatus = project.status().equals("승인") ? "APPROVED" : "DRAFT";
        try {
            return toState(workflowStateRepository.createState(project.projectId(), initialStatus));
        } catch (IllegalStateException exception) {
            return workflowStateRepository.findState(project.projectId())
                    .map(this::toState)
                    .orElseThrow(() -> exception);
        }
    }

    private WorkflowState toState(WorkflowStateRepository.WorkflowStateRecord state) {
        return new WorkflowState(state.status(), state.lastAction(), state.updatedAt());
    }

    private PortfolioSummaryResponse.ProjectSummary projectFor(String projectId) {
        return portfolioSummaryService.loadPortfolioSummary().projects().stream()
                .filter(project -> project.projectId().equals(projectId) || project.code().equals(projectId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown project id: " + projectId));
    }

    private static final class WorkflowState {
        private final String status;
        private final String lastAction;
        private final LocalDateTime updatedAt;

        private WorkflowState(String status, String lastAction, LocalDateTime updatedAt) {
            this.status = status;
            this.lastAction = lastAction;
            this.updatedAt = updatedAt;
        }
    }

    private enum WorkflowRole {
        PLANNER,
        FINANCE_REVIEWER,
        EXECUTIVE
    }

    private enum WorkflowAction {
        SUBMIT("REVIEW", List.of(WorkflowRole.PLANNER), "기획서를 검토 단계로 보냈습니다."),
        APPROVE("APPROVED", List.of(WorkflowRole.FINANCE_REVIEWER, WorkflowRole.EXECUTIVE), "승인했습니다."),
        REJECT("REJECTED", List.of(WorkflowRole.FINANCE_REVIEWER, WorkflowRole.EXECUTIVE), "반려했습니다."),
        COMMENT("REVIEW", List.of(WorkflowRole.FINANCE_REVIEWER, WorkflowRole.EXECUTIVE), "코멘트를 남겼습니다.");

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
