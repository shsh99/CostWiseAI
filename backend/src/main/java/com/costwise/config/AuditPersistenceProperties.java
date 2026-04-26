package com.costwise.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.persistence")
public record AuditPersistenceProperties(
        String supabaseUrl,
        String jdbcUrl,
        String username,
        String password,
        String sslMode) {

    public ResolvedConnection resolveConnection() {
        String explicitJdbc = trimmedOrNull(jdbcUrl);
        String supabaseDatabaseUrl = trimmedOrNull(supabaseUrl);
        SupabaseJdbcUrlConverter.JdbcConnection converted =
                supabaseDatabaseUrl == null ? null : SupabaseJdbcUrlConverter.convert(supabaseDatabaseUrl);
        if (explicitJdbc != null) {
            String resolvedUsername = fallback(trimmedOrNull(username), converted == null ? null : converted.username());
            String resolvedPassword = password;
            if (resolvedPassword == null && converted != null) {
                resolvedPassword = converted.password();
            }
            return new ResolvedConnection(
                    withSslMode(explicitJdbc),
                    requireNonBlank(resolvedUsername, "app.persistence.username"),
                    resolvePasswordForJdbc(resolvedPassword, "app.persistence.password", explicitJdbc));
        }

        if (converted != null) {
            String resolvedUsername = fallback(trimmedOrNull(username), converted.username());
            String resolvedPassword = fallback(trimmedOrNull(password), converted.password());
            return new ResolvedConnection(
                    withSslMode(converted.jdbcUrl()),
                    requireNonBlank(resolvedUsername, "Supabase URL username"),
                    resolvePasswordForJdbc(resolvedPassword, "Supabase URL password", converted.jdbcUrl()));
        }

        throw new IllegalStateException("Set app.persistence.jdbc-url or app.persistence.supabase-url");
    }

    private String withSslMode(String jdbc) {
        String mode = trimmedOrNull(sslMode);
        if (mode == null || !jdbc.startsWith("jdbc:postgresql://") || jdbc.toLowerCase().contains("sslmode=")) {
            return jdbc;
        }
        return jdbc + (jdbc.contains("?") ? "&" : "?") + "sslmode=" + mode;
    }

    private String fallback(String first, String second) {
        return first != null ? first : second;
    }

    private String trimmedOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requireNonBlank(String value, String label) {
        String resolved = trimmedOrNull(value);
        if (resolved == null) {
            throw new IllegalStateException(label + " is required");
        }
        return resolved;
    }

    private String resolvePassword(String value, String label) {
        if (value == null) {
            throw new IllegalStateException(label + " is required");
        }
        return value;
    }

    private String resolvePasswordForJdbc(String value, String label, String jdbcUrlValue) {
        String resolved = resolvePassword(value, label);
        if (jdbcUrlValue != null
                && jdbcUrlValue.startsWith("jdbc:postgresql://")
                && resolved.isBlank()) {
            throw new IllegalStateException(label + " is required");
        }
        return resolved;
    }

    public record ResolvedConnection(String jdbcUrl, String username, String password) {}
}
