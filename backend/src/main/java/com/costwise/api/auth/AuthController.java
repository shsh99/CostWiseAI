package com.costwise.api.auth;

import com.costwise.api.dto.auth.LoginRequest;
import com.costwise.api.dto.auth.LoginResponse;
import com.costwise.auth.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request.email(), request.password());
        return new LoginResponse(
                result.accessToken(),
                "Bearer",
                result.expiresAt().toString(),
                new LoginResponse.UserSession(
                        result.userId(),
                        result.email(),
                        result.displayName(),
                        result.role(),
                        result.division(),
                        result.status()));
    }
}
