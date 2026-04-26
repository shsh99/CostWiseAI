package com.costwise.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AuditPersistencePropertiesTest {

    @Test
    void explicitJdbcPasswordMustNotBeBlankForPostgresql() {
        AuditPersistenceProperties properties = new AuditPersistenceProperties(
                "postgresql://postgres.user:secret-pass@db.example.supabase.co:6543/postgres",
                "jdbc:postgresql://db.example.supabase.co:6543/postgres",
                "postgres.user",
                "   ",
                "require");

        assertThatThrownBy(properties::resolveConnection)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.persistence.password is required");
    }

    @Test
    void resolvesConnectionFromSupabaseUrlWhenJdbcUrlMissing() {
        AuditPersistenceProperties properties = new AuditPersistenceProperties(
                "postgresql://postgres.user:secret-pass@db.example.supabase.co:6543/postgres",
                null,
                null,
                null,
                "require");

        AuditPersistenceProperties.ResolvedConnection resolved = properties.resolveConnection();

        assertThat(resolved.jdbcUrl())
                .isEqualTo("jdbc:postgresql://db.example.supabase.co:6543/postgres?sslmode=require");
        assertThat(resolved.username()).isEqualTo("postgres.user");
        assertThat(resolved.password()).isEqualTo("secret-pass");
    }
}
