package com.costwise.api;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

@SpringBootTest(properties = {
    "app.security.jwt.issuer-uri=https://example.supabase.co/auth/v1",
    "app.security.jwt.audience=authenticated",
    "app.security.jwt.secret-base64=c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ="
})
@AutoConfigureMockMvc
class WorkflowControllerSecurityTest {

    private static final String ISSUER = "https://example.supabase.co/auth/v1";
    private static final String AUDIENCE = "authenticated";
    private static final String SECRET_BASE64 = "c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void reviewEndpointWithoutBearerTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/projects/14/review")
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"SUBMIT\",\"comment\":\"검토 요청\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reviewEndpointRejectsExpiredBearerToken() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/projects/14/review")
                        .header("Authorization", bearerToken(token("planner", ISSUER, AUDIENCE, now.minusSeconds(3600), now.minusSeconds(1800))))
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"SUBMIT\",\"comment\":\"만료 토큰\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reviewEndpointRejectsWrongIssuer() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/projects/14/review")
                        .header("Authorization", bearerToken(token("planner", "https://wrong.example.com/auth/v1", AUDIENCE, now, now.plusSeconds(3600))))
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"SUBMIT\",\"comment\":\"발급자 오류\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void reviewEndpointRejectsWrongAudience() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/projects/14/review")
                        .header("Authorization", bearerToken(token("planner", ISSUER, "other-audience", now, now.plusSeconds(3600))))
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"SUBMIT\",\"comment\":\"대상자 오류\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void auditLogsRejectMissingToken() throws Exception {
        mockMvc.perform(get("/api/audit-logs?projectId=P-100"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void auditLogsRequireProjectId() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(get("/api/audit-logs")
                        .header("Authorization", bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void auditLogsAllowPlannerRole() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(get("/api/audit-logs?projectId=P-100")
                        .header("Authorization", bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600)))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void reviewEndpointAllowsPlannerToSubmit() throws Exception {
        Instant now = Instant.now();
        mockMvc.perform(post("/api/projects/14/review")
                        .header("Authorization", bearerToken(token("planner", ISSUER, AUDIENCE, now, now.plusSeconds(3600))))
                        .contentType(APPLICATION_JSON)
                        .content("{\"action\":\"SUBMIT\",\"comment\":\"검토 요청\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVIEW"))
                .andExpect(jsonPath("$.lastAction").value("SUBMIT"));
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
