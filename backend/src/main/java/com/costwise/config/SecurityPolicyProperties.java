package com.costwise.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.security")
public record SecurityPolicyProperties(
        boolean docsPublic,
        boolean actuatorAllPublic,
        boolean hstsEnabled,
        Cors cors,
        String contentSecurityPolicy) {

    public record Cors(
            List<String> allowedOrigins,
            List<String> allowedMethods,
            List<String> allowedHeaders,
            List<String> exposedHeaders,
            long maxAgeSeconds) {}
}
