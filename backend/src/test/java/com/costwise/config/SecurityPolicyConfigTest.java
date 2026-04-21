package com.costwise.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "app.security.jwt.issuer-uri=https://example.supabase.co/auth/v1",
    "app.security.jwt.audience=authenticated",
    "app.security.jwt.secret-base64=c3VwYWJhc2UtYmVhcmVyLXRlc3Qtc2VjcmV0LXN1cHBvcnQ=",
    "app.security.docs-public=false",
    "app.security.cors.allowed-origins=http://localhost:5173,https://costwiseai.pages.dev"
})
@AutoConfigureMockMvc
class SecurityPolicyConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void includesBaselineSecurityHeadersOnPublicApi() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().exists("Referrer-Policy"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    void allowsCorsPreflightForConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/health")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void rejectsCorsPreflightForUnconfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/health")
                        .header("Origin", "https://evil.example.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }

    @Test
    void blocksApiDocsWhenDocsAreNotPublic() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isUnauthorized());
    }
}
