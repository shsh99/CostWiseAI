package com.costwise.api;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.hamcrest.Matchers.nullValue;

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
class AuditLogControllerTest {

    private static final String ISSUER = "https://example.supabase.co/auth/v1";
    private static final String AUDIENCE = "authenticated";
    private static final String SECRET_BASE64 = "c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void appendAndQuerySupportsFilteringCursorAndSecretMasking() throws Exception {
        Instant now = Instant.now();
        String plannerAuth = bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)));

        mockMvc.perform(post("/api/audit-logs")
                        .header("Authorization", plannerAuth)
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
                .andExpect(jsonPath("$.actorRole").value("PLANNER"))
                .andExpect(jsonPath("$.actorId").value("planner@example.com"))
                .andExpect(jsonPath("$.metadata.token").value("***"))
                .andExpect(jsonPath("$.requestContext.authorization").value("***"));

        mockMvc.perform(post("/api/audit-logs")
                        .header("Authorization", plannerAuth)
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
                        .header("Authorization", plannerAuth)
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
                        .header("Authorization", plannerAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("APPROVE"))
                .andExpect(jsonPath("$.nextCursor").isNotEmpty())
                .andReturn();

        String cursor = JsonFieldReader.read(firstPage.getResponse().getContentAsString(), "nextCursor");

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", plannerAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("cursor", cursor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("REVIEW"))
                .andExpect(jsonPath("$.nextCursor").value(nullValue()));

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", plannerAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("eventType", "review"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("REVIEW"));

        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", plannerAuth)
                        .queryParam("projectId", "PJT-001")
                        .queryParam("from", "2026-04-20T10:30:00Z")
                        .queryParam("to", "2026-04-20T11:30:00Z"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].eventType").value("APPROVE"));
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
