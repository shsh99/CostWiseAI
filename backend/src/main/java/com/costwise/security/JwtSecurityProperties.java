package com.costwise.security;

import jakarta.validation.constraints.NotBlank;
import java.util.Base64;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtSecurityProperties(
        @NotBlank String issuerUri,
        @NotBlank String audience,
        @NotBlank String secretBase64) {

    public SecretKey secretKey() {
        return new SecretKeySpec(Base64.getDecoder().decode(secretBase64), "HmacSHA256");
    }
}
