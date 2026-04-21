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
        if (explicitJdbc != null) {
            return new ResolvedConnection(
                    withSslMode(explicitJdbc),
                    requireNonBlank(username, "app.persistence.username"),
                    resolvePassword(password, "app.persistence.password"));
        }

        String supabaseDatabaseUrl = trimmedOrNull(supabaseUrl);
        if (supabaseDatabaseUrl != null) {
            SupabaseJdbcUrlConverter.JdbcConnection converted = SupabaseJdbcUrlConverter.convert(supabaseDatabaseUrl);
            String resolvedUsername = fallback(trimmedOrNull(username), converted.username());
            String resolvedPassword = fallback(password, converted.password());
            return new ResolvedConnection(
                    withSslMode(converted.jdbcUrl()),
                    requireNonBlank(resolvedUsername, "Supabase URL username"),
                    resolvePassword(resolvedPassword, "Supabase URL password"));
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

    public record ResolvedConnection(String jdbcUrl, String username, String password) {}
}
