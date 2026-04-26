package com.costwise.auth;

import com.costwise.security.JwtSecurityProperties;
import com.costwise.user.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final long DEFAULT_TOKEN_TTL_SECONDS = 60L * 60L * 8L;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtSecurityProperties jwtSecurityProperties;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtEncoder jwtEncoder,
            JwtSecurityProperties jwtSecurityProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.jwtSecurityProperties = jwtSecurityProperties;
    }

    public LoginResult login(String username, String password) {
        String normalizedIdentifier = requireValue(username, "username").toLowerCase(Locale.ROOT);
        String normalizedPassword = requireValue(password, "password");

        UserRepository.AuthUserRecord user = userRepository.findAuthUserByIdentifier(normalizedIdentifier)
                .orElseThrow(InvalidCredentialsException::new);
        if (!"ACTIVE".equalsIgnoreCase(user.status())) {
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(normalizedPassword, user.passwordHash())) {
            throw new InvalidCredentialsException();
        }

        Instant issuedAt = Instant.now();
        Instant expiresAt = issuedAt.plus(DEFAULT_TOKEN_TTL_SECONDS, ChronoUnit.SECONDS);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(jwtSecurityProperties.issuerUri())
                .audience(List.of(jwtSecurityProperties.audience()))
                .subject(user.id())
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("email", user.email())
                .claim("role", user.role())
                .claim("division", user.division())
                .build();
        String accessToken = jwtEncoder
                .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        return new LoginResult(
                accessToken,
                expiresAt,
                user.id(),
                user.email(),
                user.displayName(),
                user.role(),
                user.division(),
                user.status());
    }

    private String requireValue(String value, String field) {
        if (value == null || value.trim().isBlank()) {
            throw new InvalidCredentialsException();
        }
        return value.trim();
    }

    public record LoginResult(
            String accessToken,
            Instant expiresAt,
            String userId,
            String email,
            String displayName,
            String role,
            String division,
            String status) {}
}
