package com.costwise.api.dto.persistence;

import jakarta.validation.constraints.NotBlank;

public record UpdateScenarioRequest(
        @NotBlank String name,
        String description,
        boolean isBaseline,
        boolean isActive) {}
