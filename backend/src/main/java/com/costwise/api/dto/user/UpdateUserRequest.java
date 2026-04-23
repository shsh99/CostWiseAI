package com.costwise.api.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateUserRequest(
        @NotBlank @Email String email,
        @NotBlank String displayName,
        @NotBlank String role,
        @NotBlank String division,
        @NotBlank String status,
        Boolean mfaEnabled) {}
