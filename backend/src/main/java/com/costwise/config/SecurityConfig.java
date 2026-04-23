package com.costwise.config;

import com.costwise.security.JwtSecurityProperties;
import com.costwise.security.SupabaseJwtAuthenticationConverter;
import javax.crypto.SecretKey;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.BearerTokenAuthenticationEntryPoint;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
@EnableConfigurationProperties({JwtSecurityProperties.class, SecurityPolicyProperties.class})
public class SecurityConfig {

    private static final String INVALID_AUDIENCE_ERROR = "invalid_token";
    private static final String[] BUSINESS_ROLES = {"PLANNER", "PM", "FINANCE_REVIEWER", "ACCOUNTANT", "EXECUTIVE"};
    private static final String[] AUDIT_ROLES = {"EXECUTIVE", "AUDITOR", "ADMIN"};

    private final JwtSecurityProperties jwtSecurityProperties;
    private final SupabaseJwtAuthenticationConverter jwtAuthenticationConverter;
    private final SecurityPolicyProperties securityPolicyProperties;

    public SecurityConfig(
            JwtSecurityProperties jwtSecurityProperties,
            SupabaseJwtAuthenticationConverter jwtAuthenticationConverter,
            SecurityPolicyProperties securityPolicyProperties) {
        this.jwtSecurityProperties = jwtSecurityProperties;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
        this.securityPolicyProperties = securityPolicyProperties;
    }

    @Bean
    JwtDecoder jwtDecoder() {
        SecretKey secretKey = jwtSecurityProperties.secretKey();
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(secretKey).build();
        OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(jwtSecurityProperties.issuerUri());
        OAuth2TokenValidator<Jwt> withAudience = jwt ->
                jwt.getAudience() != null && jwt.getAudience().contains(jwtSecurityProperties.audience())
                        ? OAuth2TokenValidatorResult.success()
                        : OAuth2TokenValidatorResult.failure(
                                new OAuth2Error(INVALID_AUDIENCE_ERROR, "JWT audience is not allowed", null));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(withIssuer, withAudience));
        return decoder;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable);
        http.cors(Customizer.withDefaults());
        http.headers(headers -> {
            headers.contentSecurityPolicy(csp -> csp.policyDirectives(securityPolicyProperties.contentSecurityPolicy()));
            headers.referrerPolicy(referrer -> referrer.policy(
                    ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
            headers.frameOptions(frame -> frame.deny());
            if (securityPolicyProperties.hstsEnabled()) {
                headers.httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000));
            }
        });
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.formLogin(AbstractHttpConfigurer::disable);
        http.httpBasic(AbstractHttpConfigurer::disable);
        http.logout(AbstractHttpConfigurer::disable);
        http.requestCache(AbstractHttpConfigurer::disable);
        http.exceptionHandling(ex -> ex
                .authenticationEntryPoint(new BearerTokenAuthenticationEntryPoint())
                .accessDeniedHandler((request, response, exception) -> response.sendError(403)));
        http.oauth2ResourceServer(
                oauth2 -> oauth2.jwt(jwt -> jwt
                        .decoder(jwtDecoder)
                        .jwtAuthenticationConverter(jwtAuthenticationConverter)));
        http.authorizeHttpRequests(
                auth -> auth
                        .requestMatchers("/api/health")
                        .permitAll()
                        .requestMatchers("/api/dashboard",
                                "/api/portfolio/summary",
                                "/api/cost-accounting/summary",
                                "/api/valuation-risk/projects/**",
                                "/api/compute")
                        .hasAnyRole(BUSINESS_ROLES)
                        .requestMatchers("/actuator/health", "/actuator/info")
                        .permitAll()
                        .requestMatchers("/actuator/**")
                        .access((authentication, context) ->
                                new AuthorizationDecision(securityPolicyProperties.actuatorAllPublic()))
                        .requestMatchers("/api/projects/*/workflow", "/api/projects/*/review").authenticated()
                        .requestMatchers("/api/audit-logs").hasAnyRole(AUDIT_ROLES)
                        .requestMatchers(HttpMethod.OPTIONS, "/**")
                        .permitAll()
                        .requestMatchers("/v3/api-docs",
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/swagger-ui.html",
                                "/swagger-ui/**")
                        .access((authentication, context) ->
                                new AuthorizationDecision(securityPolicyProperties.docsPublic()))
                        .anyRequest()
                        .authenticated());
        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        SecurityPolicyProperties.Cors cors = securityPolicyProperties.cors();
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(cors.allowedOrigins());
        configuration.setAllowedMethods(cors.allowedMethods());
        configuration.setAllowedHeaders(cors.allowedHeaders());
        configuration.setExposedHeaders(cors.exposedHeaders());
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(cors.maxAgeSeconds());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
