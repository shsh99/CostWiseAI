package com.costwise.api.workflow;

import com.costwise.api.dto.workflow.ApprovalWorkflowResponse;
import com.costwise.workflow.ApprovalWorkflowService;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class WorkflowController {

    private static final List<String> WORKFLOW_ROLE_PRIORITY =
            List.of("PLANNER", "FINANCE_REVIEWER", "EXECUTIVE");

    private final ApprovalWorkflowService approvalWorkflowService;

    public WorkflowController(ApprovalWorkflowService approvalWorkflowService) {
        this.approvalWorkflowService = approvalWorkflowService;
    }

    @GetMapping("/projects/{projectId}/workflow")
    @PreAuthorize("hasAnyRole('PLANNER', 'PM', 'FINANCE_REVIEWER', 'ACCOUNTANT', 'EXECUTIVE')")
    public ApprovalWorkflowResponse workflow(@PathVariable String projectId) {
        return approvalWorkflowService.loadWorkflow(projectId);
    }

    @PostMapping("/projects/{projectId}/review")
    @PreAuthorize("hasAnyRole('PLANNER', 'PM', 'FINANCE_REVIEWER', 'ACCOUNTANT', 'EXECUTIVE')")
    public ApprovalWorkflowResponse review(
            @PathVariable String projectId,
            Authentication authentication,
            @RequestBody ReviewCommand command) {
        String role = resolveWorkflowRole(authentication);
        String actor = authentication == null ? null : authentication.getName();
        return approvalWorkflowService.transition(
                projectId, role, command.action(), actor, command.comment());
    }

    private String resolveWorkflowRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return null;
        }

        LinkedHashSet<String> resolvedRoles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(this::normalizeWorkflowRole)
                .collect(LinkedHashSet::new, LinkedHashSet::add, LinkedHashSet::addAll);

        return WORKFLOW_ROLE_PRIORITY.stream()
                .filter(resolvedRoles::contains)
                .findFirst()
                .orElseGet(() -> resolvedRoles.stream().findFirst().orElse(null));
    }

    private String normalizeWorkflowRole(String authority) {
        String normalized = authority.replaceFirst("^ROLE_", "").trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "PM" -> "PLANNER";
            case "ACCOUNTANT" -> "FINANCE_REVIEWER";
            default -> normalized;
        };
    }

    public record ReviewCommand(String action, String comment) {}
}
