package com.costwise.security;

import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class DivisionScope {

    private static final DivisionScope UNRESTRICTED = new DivisionScope(null);
    private static final Set<String> SCOPED_ROLES = Set.of("MANAGER", "PM", "PLANNER", "EXECUTIVE");
    private static final Set<String> UNRESTRICTED_ROLES =
            Set.of("ADMIN", "AUDITOR", "ACCOUNTANT", "FINANCE_REVIEWER");
    private static final List<String> DIVISION_CLAIM_KEYS =
            List.of("division", "division_code", "headquarter");
    private static final Map<String, String> DIVISION_ALIASES = Map.ofEntries(
            Map.entry("UND", "UND"),
            Map.entry("언더라이팅본부", "UND"),
            Map.entry("UNDERWRITING", "UND"),
            Map.entry("PROD", "PROD"),
            Map.entry("상품개발본부", "PROD"),
            Map.entry("PRODUCT", "PROD"),
            Map.entry("PRODUCTDEVELOPMENT", "PROD"),
            Map.entry("SALES", "SALES"),
            Map.entry("영업본부", "SALES"),
            Map.entry("IT", "IT"),
            Map.entry("IT본부", "IT"),
            Map.entry("CORP", "CORP"),
            Map.entry("경영지원본부", "CORP"),
            Map.entry("CORPORATE", "CORP"),
            Map.entry("MANAGEMENTSUPPORT", "CORP"));

    private final String divisionCode;

    private DivisionScope(String divisionCode) {
        this.divisionCode = divisionCode;
    }

    public static DivisionScope current() {
        SecurityContext context = SecurityContextHolder.getContext();
        return fromAuthentication(context == null ? null : context.getAuthentication());
    }

    public static DivisionScope fromAuthentication(Authentication authentication) {
        if (authentication == null) {
            return UNRESTRICTED;
        }

        Set<String> roles = resolveRoles(authentication);
        if (roles.stream().anyMatch(UNRESTRICTED_ROLES::contains) || roles.stream().noneMatch(SCOPED_ROLES::contains)) {
            return UNRESTRICTED;
        }

        return resolveDivisionClaim(authentication)
                .map(DivisionScope::canonicalDivision)
                .flatMap(Optional::ofNullable)
                .map(DivisionScope::new)
                .orElse(UNRESTRICTED);
    }

    public boolean isRestricted() {
        return divisionCode != null;
    }

    public String divisionCode() {
        return divisionCode;
    }

    public boolean allowsHeadquarter(String headquarter) {
        return !isRestricted() || matchesDivision(headquarter);
    }

    public boolean allowsBusinessType(String businessType) {
        return !isRestricted() || matchesDivision(businessType);
    }

    public boolean allowsProjectReference(String projectReference) {
        if (!isRestricted()) {
            return true;
        }
        if (matchesDivision(projectReference)) {
            return true;
        }
        String prefix = projectPrefix(projectReference);
        return prefix != null && matchesDivision(prefix);
    }

    private boolean matchesDivision(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return false;
        }
        String canonical = canonicalDivision(rawValue);
        return divisionCode.equals(canonical);
    }

    private static String projectPrefix(String projectReference) {
        if (projectReference == null || projectReference.isBlank()) {
            return null;
        }
        int delimiter = delimiterIndex(projectReference);
        if (delimiter <= 0) {
            return null;
        }
        return projectReference.substring(0, delimiter).trim();
    }

    private static int delimiterIndex(String value) {
        int delimiter = value.indexOf('-');
        if (delimiter < 0) {
            delimiter = value.indexOf('_');
        }
        if (delimiter < 0) {
            delimiter = value.indexOf('/');
        }
        return delimiter;
    }

    private static Set<String> resolveRoles(Authentication authentication) {
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities == null || authorities.isEmpty()) {
            return Set.of();
        }
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .map(DivisionScope::normalizeRole)
                .filter(value -> !value.isBlank())
                .collect(java.util.stream.Collectors.toSet());
    }

    private static String normalizeRole(String authority) {
        String normalized = authority == null
                ? ""
                : authority.replaceFirst("^ROLE_", "").trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "MANAGER" -> "MANAGER";
            case "PM" -> "PLANNER";
            case "ACCOUNTANT" -> "FINANCE_REVIEWER";
            default -> normalized;
        };
    }

    private static Optional<String> resolveDivisionClaim(Authentication authentication) {
        Map<String, Object> claims = jwtClaims(authentication);
        if (claims.isEmpty()) {
            return Optional.empty();
        }

        for (String key : DIVISION_CLAIM_KEYS) {
            Optional<String> value = stringValue(claims.get(key));
            if (value.isPresent()) {
                return value;
            }
        }

        for (String metadataKey : List.of("app_metadata", "user_metadata")) {
            Object metadataClaim = claims.get(metadataKey);
            if (!(metadataClaim instanceof Map<?, ?> metadata)) {
                continue;
            }
            for (String key : DIVISION_CLAIM_KEYS) {
                Optional<String> value = stringValue(metadata.get(key));
                if (value.isPresent()) {
                    return value;
                }
            }
        }

        return Optional.empty();
    }

    private static Map<String, Object> jwtClaims(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            return jwtAuthenticationToken.getToken().getClaims();
        }
        if (authentication.getPrincipal() instanceof Jwt jwt) {
            return jwt.getClaims();
        }
        return Map.of();
    }

    private static Optional<String> stringValue(Object claimValue) {
        if (claimValue == null) {
            return Optional.empty();
        }
        if (claimValue instanceof String stringValue) {
            String trimmed = stringValue.trim();
            return trimmed.isBlank() ? Optional.empty() : Optional.of(trimmed);
        }
        if (claimValue instanceof Collection<?> collection) {
            return collection.stream().flatMap(value -> stringValue(value).stream()).findFirst();
        }
        if (claimValue instanceof Map<?, ?> map) {
            for (String nestedKey : List.of("code", "division", "division_code", "headquarter", "name", "value")) {
                if (!map.containsKey(nestedKey)) {
                    continue;
                }
                Optional<String> value = stringValue(map.get(nestedKey));
                if (value.isPresent()) {
                    return value;
                }
            }
            return map.values().stream().flatMap(value -> stringValue(value).stream()).findFirst();
        }
        String normalized = claimValue.toString().trim();
        return normalized.isBlank() ? Optional.empty() : Optional.of(normalized);
    }

    private static String canonicalDivision(String rawValue) {
        String normalized = normalizeToken(rawValue);
        return DIVISION_ALIASES.get(normalized);
    }

    private static String normalizeToken(String value) {
        if (value == null) {
            return "";
        }
        return value.trim()
                .toUpperCase(Locale.ROOT)
                .replace(" ", "")
                .replace("_", "")
                .replace("-", "");
    }
}
