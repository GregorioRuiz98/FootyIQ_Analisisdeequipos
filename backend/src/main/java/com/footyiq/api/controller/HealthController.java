package com.footyiq.api.controller;

import com.footyiq.api.config.AppProperties;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
public class HealthController {

    private final MongoTemplate mongoTemplate;
    private final RestTemplate restTemplate;
    private final AppProperties appProperties;

    public HealthController(MongoTemplate mongoTemplate, RestTemplate restTemplate, AppProperties appProperties) {
        this.mongoTemplate = mongoTemplate;
        this.restTemplate = restTemplate;
        this.appProperties = appProperties;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("service", "footyiq-backend");
        result.put("status", "ok");
        result.put("backend", "ok");
        result.put("mongo", pingMongo());
        result.put("scraper", pingScraper());
        return result;
    }

    private String pingMongo() {
        try {
            mongoTemplate.executeCommand("{ ping: 1 }");
            return "ok";
        } catch (Exception ex) {
            return "down";
        }
    }

    private String pingScraper() {
        try {
            String url = appProperties.getScraperBaseUrl() + "/health";
            Map<?, ?> payload = restTemplate.getForObject(url, Map.class);
            if (payload != null && "ok".equals(payload.get("status"))) {
                return "ok";
            }
            return "down";
        } catch (Exception ex) {
            return "down";
        }
    }
}
