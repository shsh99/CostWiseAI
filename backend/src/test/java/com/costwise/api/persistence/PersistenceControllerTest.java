package com.costwise.api.persistence;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.costwise.api.support.JsonFieldReader;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import com.costwise.security.SupabaseJwtAuthenticationConverter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "app.security.jwt.issuer-uri=https://example.supabase.co/auth/v1",
    "app.security.jwt.audience=authenticated",
    "app.security.jwt.secret-base64=c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=",
    "app.persistence.jdbc-url=jdbc:h2:mem:persistence-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
    "app.persistence.username=sa",
    "app.persistence.password="
})
@AutoConfigureMockMvc
class PersistenceControllerTest {

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
                        "jdbc:h2:mem:persistence-controller;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
                        "sa",
                        "");
                Statement statement = connection.createStatement()) {
            statement.execute("drop table if exists approval_logs");
            statement.execute("drop table if exists valuation_results");
            statement.execute("drop table if exists cash_flows");
            statement.execute("drop table if exists allocation_rules");
            statement.execute("drop table if exists cost_pools");
            statement.execute("drop table if exists scenarios");
            statement.execute("drop table if exists departments");
            statement.execute("drop table if exists projects");
            statement.execute("""
                    create table projects (
                      id uuid default random_uuid() primary key,
                      code text not null unique,
                      name text not null,
                      business_type text not null default 'new_business',
                      status text not null default 'draft',
                      description text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
            statement.execute("""
                    create table departments (
                      id uuid default random_uuid() primary key,
                      code text not null unique,
                      name text not null,
                      sort_order integer not null default 0
                    )
                    """);
            statement.execute("""
                    create table scenarios (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      name text not null,
                      description text,
                      is_baseline boolean not null default false,
                      is_active boolean not null default true,
                      created_at timestamp not null default current_timestamp,
                      unique (project_id, name)
                    )
                    """);
            statement.execute("""
                    create table cost_pools (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      name text not null,
                      category text not null,
                      amount numeric(14, 2) not null,
                      currency char(3) not null default 'KRW',
                      description text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
            statement.execute("""
                    create table allocation_rules (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      cost_pool_id uuid not null references cost_pools (id) on delete cascade,
                      department_id uuid not null references departments (id),
                      basis text not null,
                      allocation_rate numeric(7, 6) not null,
                      allocated_amount numeric(14, 2) not null,
                      created_at timestamp not null default current_timestamp,
                      unique (scenario_id, cost_pool_id, department_id)
                    )
                    """);
            statement.execute("""
                    create table cash_flows (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      period_no integer not null,
                      period_label text not null,
                      year_label text not null,
                      operating_cash_flow numeric(14, 2) not null default 0,
                      investment_cash_flow numeric(14, 2) not null default 0,
                      financing_cash_flow numeric(14, 2) not null default 0,
                      net_cash_flow numeric(14, 2) not null,
                      discount_rate numeric(8, 6) not null,
                      created_at timestamp not null default current_timestamp,
                      unique (project_id, scenario_id, period_no)
                    )
                    """);
            statement.execute("""
                    create table valuation_results (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      discount_rate numeric(8, 6) not null,
                      npv numeric(14, 2) not null,
                      irr numeric(8, 6) not null,
                      payback_period numeric(8, 2) not null,
                      decision text not null,
                      assumptions clob not null,
                      created_at timestamp not null default current_timestamp,
                      unique (project_id, scenario_id)
                    )
                    """);
            statement.execute("""
                    create table approval_logs (
                      id uuid default random_uuid() primary key,
                      project_id uuid not null references projects (id) on delete cascade,
                      scenario_id uuid references scenarios (id) on delete set null,
                      actor_role text not null,
                      actor_name text not null,
                      action text not null,
                      comment text,
                      created_at timestamp not null default current_timestamp
                    )
                    """);
        }
    }

    @Test
    void projectScenarioCrudAndAnalysisPersistenceFlow() throws Exception {
        Instant now = Instant.now();
        String authHeader = bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        MvcResult createProjectResult = mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-01",
                                  "name": "테스트 프로젝트",
                                  "businessType": "new_business",
                                  "description": "persistence flow test"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.code").value("PJT-TEST-01"))
                .andReturn();

        String projectId = JsonFieldReader.read(createProjectResult.getResponse().getContentAsString(), "id");

        MvcResult createScenarioResult = mockMvc.perform(post("/api/persistence/projects/{projectId}/scenarios", projectId)
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Base",
                                  "description": "기준 시나리오",
                                  "isBaseline": true,
                                  "isActive": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andReturn();

        String scenarioId = JsonFieldReader.read(createScenarioResult.getResponse().getContentAsString(), "id");

        mockMvc.perform(put("/api/persistence/projects/{projectId}/scenarios/{scenarioId}/analysis", projectId, scenarioId)
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "allocationRules": [
                                    {
                                      "departmentCode": "D-001",
                                      "basis": "manual",
                                      "allocationRate": 1.0,
                                      "allocatedAmount": 1000000,
                                      "costPoolName": "공통비",
                                      "costPoolCategory": "shared",
                                      "costPoolAmount": 1000000
                                    }
                                  ],
                                  "cashFlows": [
                                    {
                                      "periodNo": 0,
                                      "periodLabel": "현재",
                                      "yearLabel": "2026",
                                      "operatingCashFlow": 500000,
                                      "investmentCashFlow": -200000,
                                      "financingCashFlow": 0,
                                      "discountRate": 0.08
                                    }
                                  ],
                                  "valuation": {
                                    "discountRate": 0.08,
                                    "npv": 300000,
                                    "irr": 0.12,
                                    "paybackPeriod": 2.5,
                                    "decision": "recommend",
                                    "assumptions": {
                                      "growthRate": 0.03
                                    }
                                  },
                                  "approval": {
                                    "actorRole": "planner",
                                    "actorName": "plan-user",
                                    "action": "allocated",
                                    "comment": "분석 반영",
                                    "projectStatus": "in_review"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allocationRuleCount").value(1))
                .andExpect(jsonPath("$.cashFlowCount").value(1));

        mockMvc.perform(get("/api/persistence/projects/{projectId}", projectId)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.status").value("in_review"))
                .andExpect(jsonPath("$.scenarios[0].id").value(scenarioId))
                .andExpect(jsonPath("$.scenarios[0].valuation.decision").value("recommend"))
                .andExpect(jsonPath("$.approval.status").value("in_review"));
    }

    @Test
    void createProjectAcceptsPmRoleClaim() throws Exception {
        Instant now = Instant.now();
        String authHeader = bearerToken(token("PM", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-03",
                                  "name": "PM alias project",
                                  "businessType": "new_business",
                                  "description": "pm alias test"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("PJT-TEST-03"));
    }

    @Test
    void createProjectAcceptsAccountantRoleClaim() throws Exception {
        Instant now = Instant.now();
        String authHeader = bearerToken(token("ACCOUNTANT", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-04",
                                  "name": "Accountant alias project",
                                  "businessType": "new_business",
                                  "description": "accountant alias test"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value("PJT-TEST-04"));
    }

    @Test
    void createProjectRejectsScopedPlannerWhenBusinessTypeIsOutsideDivisionClaim() throws Exception {
        Instant now = Instant.now();
        String authHeader = bearerToken(token(
                "PM",
                ISSUER,
                AUDIENCE,
                now,
                now.plusSeconds(3600),
                Map.of("division", "언더라이팅본부")));

        mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-05",
                                  "name": "Scoped PM denied project",
                                  "businessType": "영업본부",
                                  "description": "division mismatch"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void projectDetailRejectsScopedPlannerOutsideClaimedDivision() throws Exception {
        Instant now = Instant.now();
        String creatorAuth = bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        MvcResult createProjectResult = mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", creatorAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-06",
                                  "name": "Scoped read deny project",
                                  "businessType": "영업본부",
                                  "description": "division scoped read deny"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = JsonFieldReader.read(createProjectResult.getResponse().getContentAsString(), "id");
        String scopedPmAuth = bearerToken(token(
                "PM",
                ISSUER,
                AUDIENCE,
                now,
                now.plusSeconds(3600),
                Map.of("headquarter", "언더라이팅본부")));

        mockMvc.perform(get("/api/persistence/projects/{projectId}", projectId)
                        .header("Authorization", scopedPmAuth))
                .andExpect(status().isForbidden());
    }

    @Test
    void projectDetailAllowsAccountantAcrossDivisionsWithDivisionClaim() throws Exception {
        Instant now = Instant.now();
        String creatorAuth = bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        MvcResult createProjectResult = mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", creatorAuth)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-07",
                                  "name": "Accountant unrestricted project",
                                  "businessType": "영업본부",
                                  "description": "accountant unrestricted"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = JsonFieldReader.read(createProjectResult.getResponse().getContentAsString(), "id");
        String accountantAuth = bearerToken(token(
                "ACCOUNTANT",
                ISSUER,
                AUDIENCE,
                now,
                now.plusSeconds(3600),
                Map.of("division_code", "UND")));

        mockMvc.perform(get("/api/persistence/projects/{projectId}", projectId)
                        .header("Authorization", accountantAuth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(projectId))
                .andExpect(jsonPath("$.businessType").value("영업본부"));
    }

    @Test
    void deleteScenarioRemovesItFromProjectDetail() throws Exception {
        Instant now = Instant.now();
        String authHeader = bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        MvcResult createProjectResult = mockMvc.perform(post("/api/persistence/projects")
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "code": "PJT-TEST-02",
                                  "name": "삭제 테스트 프로젝트",
                                  "businessType": "new_business",
                                  "description": "delete scenario test"
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String projectId = JsonFieldReader.read(createProjectResult.getResponse().getContentAsString(), "id");

        MvcResult createScenarioResult = mockMvc.perform(post("/api/persistence/projects/{projectId}/scenarios", projectId)
                        .header("Authorization", authHeader)
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "삭제 대상 시나리오",
                                  "description": "삭제 전용",
                                  "isBaseline": false,
                                  "isActive": true
                                }
                                """))
                .andExpect(status().isCreated())
                .andReturn();

        String scenarioId = JsonFieldReader.read(createScenarioResult.getResponse().getContentAsString(), "id");

        mockMvc.perform(delete("/api/persistence/projects/{projectId}/scenarios/{scenarioId}", projectId, scenarioId)
                        .header("Authorization", authHeader))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/persistence/projects/{projectId}", projectId)
                        .header("Authorization", authHeader))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scenarios.length()").value(0));
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
                .subject("user-123")
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
            case "pm", "planner" -> "PLANNER";
            case "accountant", "finance_reviewer" -> "FINANCE_REVIEWER";
            case "executive", "auditor", "admin" -> "EXECUTIVE";
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
