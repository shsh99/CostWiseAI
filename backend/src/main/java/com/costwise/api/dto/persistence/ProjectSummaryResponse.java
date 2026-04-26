package com.costwise.api.dto.persistence;

import java.time.LocalDateTime;

public record ProjectSummaryResponse(
        String id,
        String code,
        String name,
        String businessType,
        String status,
        String description,
        LocalDateTime createdAt) {}
