package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "competitions")
public class ImportedCompetition {

    @Id
    private String id;
    private Integer externalId;
    private String key;
    private String name;
    private String country;
    private String sourceUrl;
    private Instant createdAt = Instant.now();
    private Instant lastImportedAt = Instant.now();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getExternalId() {
        return externalId;
    }

    public void setExternalId(Integer externalId) {
        this.externalId = externalId;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getSourceUrl() {
        return sourceUrl;
    }

    public void setSourceUrl(String sourceUrl) {
        this.sourceUrl = sourceUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getLastImportedAt() {
        return lastImportedAt;
    }

    public void setLastImportedAt(Instant lastImportedAt) {
        this.lastImportedAt = lastImportedAt;
    }
}
