package com.costwise.api.dto.audit;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public record CreateAuditLogRequest(
        @NotBlank String projectId,
        @NotBlank String eventType,
        @NotBlank String actorRole,
        @NotBlank String actorId,
        @NotBlank String action,
        @NotBlank String target,
        @NotBlank String result,
        @NotNull JsonNode metadata,
        @NotNull Instant occurredAt) {}
