package com.costwise.api.audit;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.costwise.api.dto.audit.CreateAuditLogRequest;
import com.costwise.api.support.JsonFieldReader;
import com.costwise.audit.AuditLogService;
import com.costwise.security.SupabaseJwtAuthenticationConverter;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "app.security.jwt.issuer-uri=https://example.supabase.co/auth/v1",
    "app.security.jwt.audience=authenticated",
    "app.security.jwt.secret-base64=c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=",
    "app.persistence.jdbc-url=jdbc:h2:mem:auditlog;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "app.persistence.username=sa",
    "app.persistence.password="
})
@AutoConfigureMockMvc
class AuditLogControllerTest {

    private static final String ISSUER = "https://example.supabase.co/auth/v1";
    private static final String AUDIENCE = "authenticated";
    private static final String SECRET_BASE64 = "c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SupabaseJwtAuthenticationConverter jwtAuthenticationConverter;

    @TestConfiguration
    static class AuditLogSecurityTestConfiguration {

        @Bean
        @Order(0)
        SecurityFilterChain auditLogSecurityFilterChain(
                HttpSecurity http,
                JwtDecoder jwtDecoder,
                SupabaseJwtAuthenticationConverter jwtAuthenticationConverter) throws Exception {
            return http
                    .securityMatcher("/api/audit-logs", "/api/audit-logs/**")
                    .csrf(AbstractHttpConfigurer::disable)
                    .exceptionHandling(ex -> ex.authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                    .authorizeHttpRequests(auth -> auth.anyRequest().hasAnyRole("EXECUTIVE", "AUDITOR", "ADMIN"))
                    .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt
                            .decoder(jwtDecoder)
                            .jwtAuthenticationConverter(jwtAuthenticationConverter)))
                    .build();
        }
    }

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

    @Test
    void appendDoesNotCollectAuthorizationHeaderInRequestContext() {
        AuditLogService auditLogService = mock(AuditLogService.class);
        com.costwise.persistence.PersistenceService persistenceService = mock(com.costwise.persistence.PersistenceService.class);
        AuditLogController controller = new AuditLogController(auditLogService, persistenceService);
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.addHeader("Authorization", "Bearer raw-header-value");
        httpRequest.addHeader("X-Request-Id", "req-unit");
        httpRequest.addHeader("User-Agent", "unit-test");
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(
                "controller-user",
                "credentials",
                List.of(new SimpleGrantedAuthority("ROLE_PLANNER")));

        controller.append(
                new CreateAuditLogRequest(
                        "PJT-UNIT",
                        "REVIEW",
                        "system",
                        "fallback-user",
                        "submit",
                        "project",
                        "success",
                        JsonNodeFactory.instance.objectNode(),
                        Instant.parse("2026-04-20T10:00:00Z")),
                authentication,
                httpRequest);

        ArgumentCaptor<AuditLogService.AppendCommand> commandCaptor =
                ArgumentCaptor.forClass(AuditLogService.AppendCommand.class);
        verify(auditLogService).append(commandCaptor.capture());

        Assertions.assertFalse(commandCaptor.getValue().requestContext().has("authorization"));
        Assertions.assertEquals("req-unit", commandCaptor.getValue().requestContext().path("requestId").asText());
        Assertions.assertEquals("unit-test", commandCaptor.getValue().requestContext().path("userAgent").asText());
    }

    @BeforeEach
    void createSchema() throws Exception {
        try (Connection connection = DriverManager.getConnection(
                        "jdbc:h2:mem:auditlog;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                Statement statement = connection.createStatement()) {
            statement.execute("drop table if exists projects");
            statement.execute("drop table if exists audit_logs");
            statement.execute("""
                    create table projects (
                      id uuid primary key,
                      code text not null unique,
                      name text not null,
                      business_type text not null,
                      status text not null default 'draft',
                      description text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
            statement.execute("""
                    insert into projects (id, code, name, business_type, status, description, created_at)
                    values
                    ('10000000-0000-0000-0000-000000000001', 'UND-PRJ-001', 'Underwriting Project', '언더라이팅본부', 'in_review', 'seed project', timestamp '2026-04-20 09:00:00'),
                    ('10000000-0000-0000-0000-000000000002', 'SALES-PRJ-001', 'Sales Project', '영업본부', 'in_review', 'seed project', timestamp '2026-04-20 09:10:00')
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
    void appendAndQuerySupportsFilteringCursorAndSecretMasking() throws Exception {
        Instant now = Instant.now();
        String executiveAuth = bearerToken(token("executive", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(post("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .header("X-Request-Id", "req-1")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": "PJT-001",
                                  "eventType": "REVIEW",
                                  "actorRole": "system",
                                  "actorId": "script-user",
                                  "action": "submit",
                                  "target": "project",
                                  "result": "success",
                                  "metadata": {
                                    "token": "sb_publishable_secret",
                                    "note": "first-event"
                                  },
                                  "occurredAt": "2026-04-20T10:00:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.actorRole").value("EXECUTIVE"))
                .andExpect(jsonPath("$.actorId").value("executive@example.com"))
                .andExpect(jsonPath("$.metadata.token").value("***"))
                .andExpect(jsonPath("$.requestContext.authorization").doesNotExist());

        mockMvc.perform(post("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .header("X-Request-Id", "req-2")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": "PJT-001",
                                  "eventType": "APPROVE",
                                  "actorRole": "system",
                                  "actorId": "script-user",
                                  "action": "approve",
                                  "target": "project",
                                  "result": "success",
                                  "metadata": {
                                    "comment": "second-event",
                                    "authorization": "Bearer abc.def.ghi"
                                  },
                                  "occurredAt": "2026-04-20T11:00:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.metadata.authorization").value("***"));

        mockMvc.perform(post("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": "PJT-002",
                                  "eventType": "REVIEW",
                                  "actorRole": "system",
                                  "actorId": "script-user",
                                  "action": "review",
                                  "target": "project",
                                  "result": "success",
                                  "metadata": {
                                    "note": "other-project"
                                  },
                                  "occurredAt": "2026-04-20T12:00:00Z"
                                }
                                """))
                .andExpect(status().isCreated());

        MvcResult firstPage = mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("APPROVE"))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn();

        String cursor = JsonFieldReader.read(firstPage.getResponse().getContentAsString(), "nextCursor");

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("cursor", cursor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("REVIEW"))
                .andExpect(jsonPath("$.nextCursor").value(nullValue()));

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("eventType", "review"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("REVIEW"));

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("from", "2026-04-20T10:30:00Z")
                        .queryParam("to", "2026-04-20T11:30:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("APPROVE"))
                .andExpect(jsonPath("$.items[0].metadata.authorization").value("***"));
    }

    @Test
    void queryAllowsAuditorRole() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", bearerToken(token("auditor", ISSUER, AUDIENCE, now, now.plusSeconds(3600))))
                        .queryParam("projectId", "PJT-100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void queryRejectsScopedExecutiveOutsideDivisionClaim() throws Exception {
        Instant now = Instant.now();
        String scopedExecutiveAuth = bearerToken(token(
                "executive",
                ISSUER,
                AUDIENCE,
                now,
                now.plusSeconds(3600),
                Map.of("division", "언더라이팅본부")));

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", scopedExecutiveAuth)
                        .queryParam("projectId", "SALES-PRJ-001"))
                .andExpect(status().isForbidden());
    }

    @Test
    void appendAllowsScopedExecutiveWithinDivisionClaim() throws Exception {
        Instant now = Instant.now();
        String scopedExecutiveAuth = bearerToken(token(
                "executive",
                ISSUER,
                AUDIENCE,
                now,
                now.plusSeconds(3600),
                Map.of("division_code", "UND")));

        mockMvc.perform(post("/api/audit-logs")
                        .header("Authorization", scopedExecutiveAuth)
                        .header("X-Request-Id", "req-division-ok")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "projectId": "UND-PRJ-001",
                                  "eventType": "REVIEW",
                                  "actorRole": "system",
                                  "actorId": "script-user",
                                  "action": "submit",
                                  "target": "project",
                                  "result": "success",
                                  "metadata": {
                                    "note": "division-allowed"
                                  },
                                  "occurredAt": "2026-04-20T13:00:00Z"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value("UND-PRJ-001"));
    }

    @Test
    void queryAllowsAuditorRoleWithDivisionClaim() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", bearerToken(token(
                                "auditor",
                                ISSUER,
                                AUDIENCE,
                                now,
                                now.plusSeconds(3600),
                                Map.of("headquarter", "언더라이팅본부"))))
                        .queryParam("projectId", "SALES-PRJ-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void queryAllowsAdminRole() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", bearerToken(token("admin", ISSUER, AUDIENCE, now, now.plusSeconds(3600))))
                        .queryParam("projectId", "PJT-100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void appendOnlyEndpointRejectsUpdateAndDeleteMethods() throws Exception {
        Instant now = Instant.now();
        String executiveAuth = bearerToken(token("executive", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(put("/api/audit-logs")
                        .header("Authorization", executiveAuth)
                        .contentType(APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isMethodNotAllowed());

        mockMvc.perform(delete("/api/audit-logs")
                        .header("Authorization", executiveAuth))
                .andExpect(status().isMethodNotAllowed());
    }

    private String bearerToken(String token) {
        return "Bearer " + token;
    }

    private String token(String role, String issuer, String audience, Instant issuedAt, Instant expiresAt) {
        return token(role, issuer, audience, issuedAt, expiresAt, Map.of());
    }

    private String token(
            String role,
            String issuer,
            String audience,
            Instant issuedAt,
            Instant expiresAt,
            Map<String, Object> extraClaims) {
        SecretKey secretKey = new SecretKeySpec(Base64.getDecoder().decode(SECRET_BASE64), "HmacSHA256");
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
        JwtClaimsSet.Builder claimsBuilder = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject(role + "@example.com")
                .audience(List.of(audience))
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("email", role + "@example.com")
                .claim("role", role);
        extraClaims.forEach(claimsBuilder::claim);
        JwtClaimsSet claims = claimsBuilder.build();
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
