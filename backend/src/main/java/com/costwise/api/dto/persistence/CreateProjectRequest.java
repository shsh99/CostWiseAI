package com.costwise.api.dto.persistence;

import jakarta.validation.constraints.NotBlank;

public record CreateProjectRequest(
        @NotBlank String code,
        @NotBlank String name,
        @NotBlank String businessType,
        String description) {}
