package com.footyiq.api.auth;

import com.footyiq.api.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtTokenService {

    private final AppProperties appProperties;

    public JwtTokenService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    public String generateToken(String username) {
        Date now = new Date();
        Date expiration = new Date(now.getTime() + appProperties.getJwtExpirationMs());

        return Jwts.builder()
                .subject(username)
                .issuedAt(now)
                .expiration(expiration)
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token) {
        Claims claims = Jwts.parser()
            .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = appProperties.getJwtSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes.length >= 32 ? keyBytes : (appProperties.getJwtSecret() + "01234567890123456789012345678901").getBytes(StandardCharsets.UTF_8));
    }
}
