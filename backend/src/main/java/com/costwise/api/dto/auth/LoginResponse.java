package com.costwise.api.dto.auth;

public record LoginResponse(
        String accessToken,
        String tokenType,
        String expiresAt,
        UserSession user) {

    public record UserSession(
            String id,
            String email,
            String displayName,
            String role,
            String division,
            String status) {}
}
