package com.costwise.config;

import java.net.URI;
import java.net.URISyntaxException;

public final class SupabaseJdbcUrlConverter {

    private SupabaseJdbcUrlConverter() {}

    public static JdbcConnection convert(String databaseUrl) {
        URI uri = parse(databaseUrl);
        if (!"postgresql".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalArgumentException("Only postgresql:// URLs are supported for Supabase");
        }

        String userInfo = uri.getUserInfo();
        if (userInfo == null || !userInfo.contains(":")) {
            throw new IllegalArgumentException("Supabase URL must include username and password");
        }

        String[] credentials = userInfo.split(":", 2);
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();
        return new JdbcConnection(jdbcUrl, credentials[0], credentials[1]);
    }

    private static URI parse(String databaseUrl) {
        try {
            return new URI(databaseUrl);
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("Invalid Supabase database URL", exception);
        }
    }

    public record JdbcConnection(String jdbcUrl, String username, String password) {}
}
