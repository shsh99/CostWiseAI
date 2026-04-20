package com.costwise.api;

import com.costwise.api.dto.ApprovalWorkflowResponse;
import com.costwise.service.ApprovalWorkflowService;
import com.costwise.service.AuditLogService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WorkflowController {

    private final ApprovalWorkflowService approvalWorkflowService;
    private final AuditLogService auditLogService;

    public WorkflowController(
            ApprovalWorkflowService approvalWorkflowService, AuditLogService auditLogService) {
        this.approvalWorkflowService = approvalWorkflowService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/projects/{projectId}/workflow")
    public ApprovalWorkflowResponse workflow(@PathVariable String projectId) {
        return approvalWorkflowService.loadWorkflow(projectId);
    }

    @PostMapping("/projects/{projectId}/review")
    public ApprovalWorkflowResponse review(
            @PathVariable String projectId, @RequestBody ReviewCommand command) {
        return approvalWorkflowService.transition(
                projectId, command.role(), command.action(), command.actor(), command.comment());
    }

    @GetMapping("/audit-logs")
    public List<ApprovalWorkflowResponse.AuditEvent> auditLogs() {
        return auditLogService.recentEvents();
    }

    public record ReviewCommand(String actor, String role, String action, String comment) {}
}
