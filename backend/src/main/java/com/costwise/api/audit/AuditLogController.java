package com.costwise.api.audit;

import com.costwise.api.dto.audit.AuditLogEntryResponse;
import com.costwise.api.dto.audit.AuditLogListResponse;
import com.costwise.api.dto.audit.CreateAuditLogRequest;
import com.costwise.audit.AuditLogService;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.Comparator;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AuditLogEntryResponse append(
            @Valid @RequestBody CreateAuditLogRequest request,
            Authentication authentication,
            HttpServletRequest httpRequest) {
        String actorRole = resolveActorRole(authentication, request.actorRole());
        String actorId = resolveActorId(authentication, request.actorId());
        return auditLogService.append(new AuditLogService.AppendCommand(
                request.projectId(),
                request.eventType(),
                actorRole,
                actorId,
                request.action(),
                request.target(),
                request.result(),
                request.metadata(),
                requestContext(authentication, httpRequest),
                request.occurredAt()));
    }

    @GetMapping
    public AuditLogListResponse query(
            @RequestParam String projectId,
            @RequestParam(required = false) String eventType,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String cursor) {
        return auditLogService.query(new AuditLogService.QueryCommand(
                projectId, eventType, from, to, limit, cursor));
    }

    private String resolveActorRole(Authentication authentication, String fallbackRole) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return fallbackRole;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(value -> value.replaceFirst("^ROLE_", ""))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .sorted(Comparator.naturalOrder())
                .findFirst()
                .orElse(fallbackRole);
    }

    private String resolveActorId(Authentication authentication, String fallbackActorId) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            return fallbackActorId;
        }
        return authentication.getName();
    }

    private ObjectNode requestContext(Authentication authentication, HttpServletRequest request) {
        ObjectNode context = JsonNodeFactory.instance.objectNode();
        context.put("requestId", request.getHeader("X-Request-Id"));
        context.put("remoteAddr", request.getRemoteAddr());
        context.put("userAgent", request.getHeader("User-Agent"));
        context.put("authorization", request.getHeader("Authorization"));
        context.put("principal", authentication == null ? null : authentication.getName());
        context.put("capturedAt", Instant.now().toString());
        return context;
    }
}
