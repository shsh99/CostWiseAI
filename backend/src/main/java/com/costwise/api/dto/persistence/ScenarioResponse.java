package com.costwise.api.dto.persistence;

import java.time.LocalDateTime;

public record ScenarioResponse(
        String id,
        String name,
        String description,
        boolean isBaseline,
        boolean isActive,
        LocalDateTime createdAt) {}
