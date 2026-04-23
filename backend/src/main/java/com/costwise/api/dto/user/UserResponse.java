package com.costwise.api.dto.user;

import java.time.LocalDateTime;

public record UserResponse(
        String id,
        String email,
        String displayName,
        String role,
        String division,
        String status,
        boolean mfaEnabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {}
