package com.costwise.api;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
    "app.security.jwt.issuer-uri=https://example.supabase.co/auth/v1",
    "app.security.jwt.audience=authenticated",
    "app.security.jwt.secret-base64=c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ="
})
@AutoConfigureMockMvc
class PersistenceControllerTest {

    private static final String ISSUER = "https://example.supabase.co/auth/v1";
    private static final String AUDIENCE = "authenticated";
    private static final String SECRET_BASE64 = "c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=";

    @Autowired
    private MockMvc mockMvc;

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
        SecretKey secretKey = new SecretKeySpec(Base64.getDecoder().decode(SECRET_BASE64), "HmacSHA256");
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(secretKey));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .subject("user-123")
                .audience(List.of(audience))
                .issuedAt(issuedAt)
                .expiresAt(expiresAt)
                .claim("email", role + "@example.com")
                .claim("role", role)
                .build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }
}
