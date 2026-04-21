package com.costwise.api.dto.persistence;

import jakarta.validation.constraints.NotBlank;

public record UpdateProjectRequest(
        @NotBlank String name,
        @NotBlank String businessType,
        String description,
        @NotBlank String status) {}
