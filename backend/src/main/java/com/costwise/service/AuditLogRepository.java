package com.costwise.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.List;

public interface AuditLogRepository {

    StoredAuditEntry append(NewAuditEntry entry);

    List<StoredAuditEntry> query(QueryFilter filter, int fetchSize);

    record NewAuditEntry(
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

    record QueryFilter(
            String projectId,
            String eventType,
            Instant from,
            Instant to,
            Long cursor) {}

    record StoredAuditEntry(
            long id,
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
}
