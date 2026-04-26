package com.costwise.api.users;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.costwise.api.support.JsonFieldReader;
import com.costwise.security.SupabaseJwtAuthenticationConverter;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "app.security.jwt.issuer-uri=https://example.supabase.co/auth/v1",
    "app.security.jwt.audience=authenticated",
    "app.security.jwt.secret-base64=c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=",
    "app.persistence.jdbc-url=jdbc:h2:mem:users-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "app.persistence.username=sa",
    "app.persistence.password="
})
@AutoConfigureMockMvc
class UsersControllerTest {

    private static final String ISSUER = "https://example.supabase.co/auth/v1";
    private static final String AUDIENCE = "authenticated";
    private static final String SECRET_BASE64 = "c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SupabaseJwtAuthenticationConverter jwtAuthenticationConverter;

    @BeforeEach
    void stubJwtAuthenticationConverter() {
        when(jwtAuthenticationConverter.convert(any(Jwt.class))).thenAnswer(invocation -> {
            Jwt jwt = invocation.getArgument(0);
            String role = jwt.getClaimAsString("role");
            String authorityRole = toAuthorityRole(role);
            String principal = firstNonBlank(jwt.getClaimAsString("email"), jwt.getSubject(), jwt.getClaimAsString("sub"));
            return new JwtAuthenticationToken(jwt, List.of(new SimpleGrantedAuthority("ROLE_" + authorityRole)), principal);
        });
    }

    @BeforeEach
    void createSchema() throws Exception {
        try (Connection connection = DriverManager.getConnection(
                        "jdbc:h2:mem:users-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                Statement statement = connection.createStatement()) {
            statement.execute("drop table if exists users");
            statement.execute("drop table if exists audit_logs");
            statement.execute("""
                    create table users (
                      id uuid default random_uuid() primary key,
                      email varchar(255) not null unique,
                      display_name varchar(255) not null,
                      role varchar(64) not null,
                      division varchar(128) not null,
                      status varchar(64) not null,
                      mfa_enabled boolean not null default false,
                      password_hash varchar(255) not null default 'test-hash',
                      created_at timestamp not null default current_timestamp,
                      updated_at timestamp not null default current_timestamp
                    )
                    """);
            statement.execute("""
                    create table audit_logs (
                      id bigint generated by default as identity primary key,
                      project_id varchar(128) not null,
                      event_type varchar(64) not null,
                      actor_role varchar(64) not null,
                      actor_id varchar(255) not null,
                      action varchar(64) not null,
                      target varchar(128) not null,
                      result varchar(64) not null,
                      metadata clob not null,
                      request_context clob not null,
                      occurred_at timestamp not null,
                      created_at timestamp not null
                    )
                    """);
            statement.execute("create index idx_audit_logs_project_id_id on audit_logs (project_id, id desc)");
            statement.execute("create index idx_audit_logs_project_event_id on audit_logs (project_id, event_type, id desc)");
            statement.execute("create index idx_audit_logs_project_occurred_id on audit_logs (project_id, occurred_at desc, id desc)");
        }
    }

    @Test
    void listUsersRejectsPlannerRole() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)))))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUsersAllowsAuditorRole() throws Exception {
        seedUser("auditor-view@example.com", "Auditor View", "AUDITOR", "CORP", "ACTIVE", false);
        Instant now = Instant.now();

        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(token("auditor", ISSUER, AUDIENCE, now, now.plusSeconds(3600)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("auditor-view@example.com"));
    }

    @Test
    void listUsersAllowsExecutiveRole() throws Exception {
        seedUser("executive-view@example.com", "Executive View", "EXECUTIVE", "CORP", "ACTIVE", false);
        Instant now = Instant.now();

        mockMvc.perform(get("/api/users")
                        .header("Authorization", bearerToken(token("executive", ISSUER, AUDIENCE, now, now.plusSeconds(3600)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].email").value("executive-view@example.com"));
    }

    @Test
    void createUserRejectsExecutiveRole() throws Exception {
        Instant now = Instant.now();

        mockMvc.perform(post("/api/users")
                        .header("Authorization", bearerToken(token("executive", ISSUER, AUDIENCE, now, now.plusSeconds(3600))))
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "new-user@example.com",
                                  "displayName": "New User",
                                  "role": "PLANNER",
                                  "division": "UND",
                                  "status": "ACTIVE",
                                  "mfaEnabled": false
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCrudFlowPersistsUsersAndAppendsAudit() throws Exception {
        Instant now = Instant.now();
        String adminAuth = bearerToken(token("admin", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        MvcResult createResult = mockMvc.perform(post("/api/users")
                        .header("Authorization", adminAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "planner.user@example.com",
                                  "displayName": "Planner User",
                                  "role": "planner",
                                  "division": "UND",
                                  "status": "ACTIVE",
                                  "mfaEnabled": false
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.email").value("planner.user@example.com"))
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andReturn();

        String userId = JsonFieldReader.read(createResult.getResponse().getContentAsString(), "id");

        mockMvc.perform(get("/api/users")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(userId));

        mockMvc.perform(put("/api/users/{userId}", userId)
                        .header("Authorization", adminAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "planner.user@example.com",
                                  "displayName": "Planner User Updated",
                                  "role": "executive",
                                  "division": "CORP",
                                  "status": "SUSPENDED",
                                  "mfaEnabled": true
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Planner User Updated"))
                .andExpect(jsonPath("$.role").value("MANAGER"))
                .andExpect(jsonPath("$.division").value("CORP"))
                .andExpect(jsonPath("$.status").value("SUSPENDED"))
                .andExpect(jsonPath("$.mfaEnabled").value(true));

        mockMvc.perform(delete("/api/users/{userId}", userId)
                        .header("Authorization", adminAuth))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/users")
                        .header("Authorization", adminAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        assertAuditTrailForUser(userId);
    }

    @Test
    void adminCanResetUserPassword() throws Exception {
        seedUser("password.target@example.com", "Password Target", "MANAGER", "UND", "ACTIVE", false);
        String userId = findUserIdByEmail("password.target@example.com");
        Instant now = Instant.now();
        String adminAuth = bearerToken(token("admin", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(put("/api/users/{userId}/password", userId)
                        .header("Authorization", adminAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "password": "NewPassw0rd!"
                                }
                                """))
                .andExpect(status().isNoContent());

        try (Connection connection = DriverManager.getConnection(
                        "jdbc:h2:mem:users-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                PreparedStatement statement = connection.prepareStatement(
                        "select password_hash from users where id = ?")) {
            statement.setObject(1, java.util.UUID.fromString(userId));
            try (ResultSet resultSet = statement.executeQuery()) {
                assertTrue(resultSet.next());
                String passwordHash = resultSet.getString(1);
                assertTrue(passwordHash != null && !passwordHash.isBlank());
                assertTrue(!passwordHash.equals("NewPassw0rd!"));
            }
        }
    }

    @Test
    void executiveCannotResetUserPassword() throws Exception {
        seedUser("password.denied@example.com", "Password Denied", "MANAGER", "UND", "ACTIVE", false);
        String userId = findUserIdByEmail("password.denied@example.com");
        Instant now = Instant.now();
        String executiveAuth = bearerToken(token("executive", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(put("/api/users/{userId}/password", userId)
                        .header("Authorization", executiveAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "password": "NewPassw0rd!"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    private void seedUser(
            String email,
            String displayName,
            String role,
            String division,
            String status,
            boolean mfaEnabled) throws Exception {
        try (Connection connection = DriverManager.getConnection(
                        "jdbc:h2:mem:users-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                PreparedStatement statement = connection.prepareStatement("""
                        insert into users (email, display_name, role, division, status, mfa_enabled, created_at, updated_at)
                        values (?, ?, ?, ?, ?, ?, current_timestamp, current_timestamp)
                        """)) {
            statement.setString(1, email);
            statement.setString(2, displayName);
            statement.setString(3, role);
            statement.setString(4, division);
            statement.setString(5, status);
            statement.setBoolean(6, mfaEnabled);
            statement.executeUpdate();
        }
    }

    private void assertAuditTrailForUser(String userId) throws Exception {
        try (Connection connection = DriverManager.getConnection(
                        "jdbc:h2:mem:users-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                PreparedStatement statement = connection.prepareStatement("""
                        select action, target, actor_role, actor_id, metadata
                          from audit_logs
                         where project_id = 'USER-MGMT'
                         order by id asc
                        """);
                ResultSet resultSet = statement.executeQuery()) {
            List<String> actions = new ArrayList<>();
            while (resultSet.next()) {
                actions.add(resultSet.getString("action"));
                assertEquals(userId, resultSet.getString("target"));
                assertEquals("ADMIN", resultSet.getString("actor_role"));
                assertEquals("admin@example.com", resultSet.getString("actor_id"));
                assertTrue(resultSet.getString("metadata").contains(userId));
            }
            assertEquals(List.of("create", "update", "delete"), actions);
        }
    }

    private String findUserIdByEmail(String email) throws Exception {
        try (Connection connection = DriverManager.getConnection(
                        "jdbc:h2:mem:users-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                PreparedStatement statement = connection.prepareStatement(
                        "select id from users where lower(email) = lower(?)")) {
            statement.setString(1, email);
            try (ResultSet resultSet = statement.executeQuery()) {
                if (!resultSet.next()) {
                    throw new IllegalStateException("user not found for email " + email);
                }
                return resultSet.getObject(1).toString();
            }
        }
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }

    private String token(String role, String issuer, String audience, Instant issuedAt, Instant expiresAt) {
        SecretKey secretKey = new SecretKeySpec(Base64.getDecoder().decode(SECRET_BASE64), "HmacSHA256");
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(role + "@example.com")
                .audience(List.of(audience))
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("email", role + "@example.com")
                .claim("role", role)
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    private String toAuthorityRole(String role) {
        return switch (role == null ? "" : role.trim().toLowerCase()) {
            case "planner", "pm" -> "PLANNER";
            case "finance_reviewer", "accountant" -> "FINANCE_REVIEWER";
            case "executive" -> "EXECUTIVE";
            case "auditor" -> "AUDITOR";
            case "admin" -> "ADMIN";
            default -> role == null ? "EXECUTIVE" : role.trim().toUpperCase();
        };
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.trim().isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
