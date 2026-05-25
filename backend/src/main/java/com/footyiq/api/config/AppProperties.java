package com.footyiq.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private String jwtSecret;
    private long jwtExpirationMs;
    private String scraperBaseUrl;
    private String uploadsPath;

    public String getJwtSecret() {
        return jwtSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    public void setJwtExpirationMs(long jwtExpirationMs) {
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String getScraperBaseUrl() {
        return scraperBaseUrl;
    }

    public void setScraperBaseUrl(String scraperBaseUrl) {
        this.scraperBaseUrl = scraperBaseUrl;
    }

    public String getUploadsPath() {
        return uploadsPath;
    }

    public void setUploadsPath(String uploadsPath) {
        this.uploadsPath = uploadsPath;
    }
}
