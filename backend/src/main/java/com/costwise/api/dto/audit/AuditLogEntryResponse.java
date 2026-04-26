package com.costwise.api.dto.audit;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;

public record AuditLogEntryResponse(
        String id,
        String projectId,
        String eventType,
        String actorRole,
        String actorId,
        String action,
        String target,
        String result,
        JsonNode metadata,
        JsonNode requestContext,
        Instant occurredAt,
        Instant createdAt) {}
