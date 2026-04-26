package com.costwise.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class SupabaseJdbcUrlConverterTest {

    @Test
    void convertsSupabasePostgresqlUrlToJdbcUrlAndExtractsCredentials() {
        SupabaseJdbcUrlConverter.JdbcConnection connection = SupabaseJdbcUrlConverter.convert(
                "postgresql://postgres:secret@db.hlddhounxffxvqgvwajl.supabase.co:5432/postgres");

        assertThat(connection.jdbcUrl())
                .isEqualTo("jdbc:postgresql://db.hlddhounxffxvqgvwajl.supabase.co:5432/postgres");
        assertThat(connection.username()).isEqualTo("postgres");
        assertThat(connection.password()).isEqualTo("secret");
    }

    @Test
    void rejectsInvalidScheme() {
        assertThatThrownBy(() -> SupabaseJdbcUrlConverter.convert("https://example.com"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
