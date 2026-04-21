package com.costwise.audit;

import com.costwise.api.dto.audit.AuditLogEntryResponse;
import com.costwise.api.dto.audit.AuditLogListResponse;
import com.costwise.api.dto.workflow.ApprovalWorkflowResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDateTime;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    private static final Set<String> SENSITIVE_KEYWORDS = Set.of(
            "authorization",
            "token",
            "secret",
            "password",
            "passwd",
            "api_key",
            "apikey",
            "access_key",
            "refresh_token");

    private static final String MASKED_VALUE = "***";

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public AuditLogEntryResponse append(AppendCommand command) {
        Instant createdAt = Instant.now();
        AuditLogRepository.StoredAuditEntry entry = auditLogRepository.append(new AuditLogRepository.NewAuditEntry(
                command.projectId().trim(),
                command.eventType().trim(),
                command.actorRole().trim(),
                command.actorId().trim(),
                command.action().trim(),
                command.target().trim(),
                command.result().trim(),
                sanitize(command.metadata()),
                sanitize(command.requestContext()),
                command.occurredAt(),
                createdAt));
        return toResponse(entry);
    }

    public void record(String projectId, String actor, String role, String action, String detail) {
        ObjectNode metadata = JsonNodeFactory.instance.objectNode();
        metadata.put("detail", detail);
        append(new AppendCommand(
                projectId,
                "workflow",
                role,
                actor,
                action,
                "workflow",
                "recorded",
                metadata,
                JsonNodeFactory.instance.objectNode(),
                Instant.now()));
    }

    public List<ApprovalWorkflowResponse.AuditEvent> eventsForProject(String projectId) {
        return query(new QueryCommand(projectId, null, null, null, 200, null)).items().stream()
                .map(item -> new ApprovalWorkflowResponse.AuditEvent(
                        LocalDateTime.ofInstant(item.occurredAt(), ZoneOffset.UTC),
                        item.actorId(),
                        item.actorRole(),
                        item.action(),
                        item.metadata().path("detail").asText(item.result())))
                .toList();
    }

    public AuditLogListResponse query(QueryCommand command) {
        int limit = command.limit() == null ? 50 : command.limit();
        if (limit < 1 || limit > 200) {
            throw new IllegalArgumentException("limit must be between 1 and 200");
        }

        Long cursor = parseCursor(command.cursor());
        List<AuditLogRepository.StoredAuditEntry> filtered = auditLogRepository.query(
                new AuditLogRepository.QueryFilter(
                        command.projectId().trim(),
                        command.eventType() == null ? null : command.eventType().trim(),
                        command.from(),
                        command.to(),
                        cursor),
                limit + 1);

        List<AuditLogEntryResponse> items = filtered.stream()
                .limit(limit)
                .map(this::toResponse)
                .toList();
        String nextCursor = filtered.size() > limit
                ? String.valueOf(filtered.get(limit - 1).id())
                : null;

        return new AuditLogListResponse(items, nextCursor);
    }

    private Long parseCursor(String cursor) {
        if (cursor == null || cursor.isBlank()) {
            return null;
        }
        try {
            long parsed = Long.parseLong(cursor);
            if (parsed < 1) {
                throw new IllegalArgumentException("cursor must be a positive number");
            }
            return parsed;
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("cursor must be a positive number");
        }
    }

    private AuditLogEntryResponse toResponse(AuditLogRepository.StoredAuditEntry entry) {
        return new AuditLogEntryResponse(
                String.valueOf(entry.id()),
                entry.projectId(),
                entry.eventType(),
                entry.actorRole(),
                entry.actorId(),
                entry.action(),
                entry.target(),
                entry.result(),
                entry.metadata(),
                entry.requestContext(),
                entry.occurredAt(),
                entry.createdAt());
    }

    private JsonNode sanitize(JsonNode input) {
        JsonNode node = input == null ? JsonNodeFactory.instance.objectNode() : input.deepCopy();
        return sanitizeNode(node, null);
    }

    private JsonNode sanitizeNode(JsonNode node, String fieldName) {
        if (node == null || node.isNull()) {
            return JsonNodeFactory.instance.nullNode();
        }
        if (node.isObject()) {
            ObjectNode object = (ObjectNode) node;
            List<String> fieldNames = new ArrayList<>();
            object.fieldNames().forEachRemaining(fieldNames::add);
            for (String name : fieldNames) {
                JsonNode value = object.get(name);
                if (isSensitiveKey(name)) {
                    object.put(name, MASKED_VALUE);
                    continue;
                }
                object.set(name, sanitizeNode(value, name));
            }
            return object;
        }
        if (node.isArray()) {
            for (int i = 0; i < node.size(); i++) {
                ((com.fasterxml.jackson.databind.node.ArrayNode) node).set(i, sanitizeNode(node.get(i), fieldName));
            }
            return node;
        }
        if (node.isTextual()) {
            String value = node.asText();
            if (isSensitiveKey(fieldName) || looksSensitive(value)) {
                return JsonNodeFactory.instance.textNode(MASKED_VALUE);
            }
        }
        return node;
    }

    private boolean isSensitiveKey(String key) {
        if (key == null) {
            return false;
        }
        String normalized = key.trim().toLowerCase(Locale.ROOT);
        return SENSITIVE_KEYWORDS.stream().anyMatch(normalized::contains);
    }

    private boolean looksSensitive(String value) {
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return normalized.startsWith("bearer ")
                || normalized.startsWith("sb_")
                || normalized.contains("eyj")
                || normalized.contains("token")
                || normalized.contains("secret");
    }

    public record AppendCommand(
            String projectId,
            String eventType,
            String actorRole,
            String actorId,
            String action,
            String target,
            String result,
            JsonNode metadata,
            JsonNode requestContext,
            Instant occurredAt) {}

    public record QueryCommand(
            String projectId,
            String eventType,
            Instant from,
            Instant to,
            Integer limit,
            String cursor) {}
}
