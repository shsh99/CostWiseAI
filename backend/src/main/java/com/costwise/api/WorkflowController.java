package com.costwise.api;

import com.costwise.api.dto.ApprovalWorkflowResponse;
import com.costwise.service.ApprovalWorkflowService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    public WorkflowController(ApprovalWorkflowService approvalWorkflowService) {
        this.approvalWorkflowService = approvalWorkflowService;
    }

    @GetMapping("/projects/{projectId}/workflow")
    @PreAuthorize("hasAnyRole('PLANNER', 'FINANCE_REVIEWER', 'EXECUTIVE')")
    public ApprovalWorkflowResponse workflow(@PathVariable String projectId) {
        return approvalWorkflowService.loadWorkflow(projectId);
    }

    @PostMapping("/projects/{projectId}/review")
    @PreAuthorize("hasAnyRole('PLANNER', 'FINANCE_REVIEWER', 'EXECUTIVE')")
    public ApprovalWorkflowResponse review(
            @PathVariable String projectId,
            Authentication authentication,
            @RequestBody ReviewCommand command) {
        String role = authentication == null ? null : authentication.getAuthorities().stream()
                .findFirst()
                .map(authority -> authority.getAuthority().replaceFirst("^ROLE_", ""))
                .orElse(null);
        String actor = authentication == null ? null : authentication.getName();
        return approvalWorkflowService.transition(
                projectId, role, command.action(), actor, command.comment());
    }

    public record ReviewCommand(String action, String comment) {}
}
