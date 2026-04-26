package com.costwise.security;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private static final Set<String> SUPPORTED_ROLES =
            Set.of("ADMIN", "MANAGER", "EXECUTIVE", "PM", "ACCOUNTANT", "AUDITOR", "PLANNER", "FINANCE_REVIEWER");
    private static final Map<String, List<String>> ROLE_ALIASES = Map.of(
            "MANAGER", List.of("EXECUTIVE"),
            "PM", List.of("PM", "PLANNER"),
            "ACCOUNTANT", List.of("ACCOUNTANT", "FINANCE_REVIEWER"));

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
        String principal = firstNonBlank(jwt.getClaimAsString("email"), jwt.getSubject(), jwt.getClaimAsString("sub"));
        return new JwtAuthenticationToken(jwt, authorities, principal);
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        LinkedHashSet<String> roleNames = new LinkedHashSet<>();
        extractRoleCandidates(jwt).map(String::trim)
                .filter(candidate -> !candidate.isBlank())
                .map(candidate -> candidate.toUpperCase(Locale.ROOT))
                .filter(SUPPORTED_ROLES::contains)
                .flatMap(this::expandRoleAliases)
                .forEach(roleNames::add);

        return roleNames.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .map(GrantedAuthority.class::cast)
                .toList();
    }

    private Stream<String> extractRoleCandidates(Jwt jwt) {
        return Stream.of(
                        jwt.getClaimAsString("role"),
                        nestedStringClaim(jwt.getClaims().get("app_metadata"), "role"),
                        nestedStringClaim(jwt.getClaims().get("user_metadata"), "role"),
                        nestedStringClaim(jwt.getClaims().get("app_metadata"), "app_role"),
                        nestedStringClaim(jwt.getClaims().get("user_metadata"), "app_role"),
                        nestedStringClaim(jwt.getClaims().get("app_metadata"), "user_role"),
                        nestedStringClaim(jwt.getClaims().get("user_metadata"), "user_role"))
                .flatMap(this::flattenClaimValue);
    }

    private Stream<String> flattenClaimValue(String value) {
        return value == null ? Stream.empty() : Stream.of(value);
    }

    private Stream<String> expandRoleAliases(String role) {
        return ROLE_ALIASES.getOrDefault(role, List.of(role)).stream();
    }

    private String nestedStringClaim(Object metadataClaim, String key) {
        if (!(metadataClaim instanceof Map<?, ?> metadata)) {
            return null;
        }

        Object value = metadata.get(key);
        if (value instanceof String stringValue) {
            return stringValue;
        }
        if (value instanceof Collection<?> collection) {
            return collection.stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .findFirst()
                    .orElse(null);
        }
        if (value instanceof Map<?, ?> nestedMap) {
            return nestedMap.values().stream()
                    .filter(Objects::nonNull)
                    .map(Object::toString)
                    .findFirst()
                    .orElse(null);
        }
        return value == null ? null : value.toString();
    }

    private String firstNonBlank(String... values) {
        return Stream.of(values)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .findFirst()
                .orElse(null);
    }
}
