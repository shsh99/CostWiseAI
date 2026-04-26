package com.costwise.api.dto.workflow;

import java.time.LocalDateTime;
import java.util.List;

public record ApprovalWorkflowResponse(
        String projectId,
        String projectName,
        String status,
        String lastAction,
        LocalDateTime lastUpdatedAt,
        List<AuditEvent> auditEvents) {

    public record AuditEvent(
            LocalDateTime at,
            String actor,
            String role,
            String action,
            String detail) {}
}
