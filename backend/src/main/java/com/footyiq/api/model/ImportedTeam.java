package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "teams")
public class ImportedTeam {

    @Id
    private String id;
    private Integer externalId;
    private String name;
    private String shortName;
    private String country;
    private List<Integer> competitionExternalIds = new ArrayList<>();
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getShortName() {
        return shortName;
    }

    public void setShortName(String shortName) {
        this.shortName = shortName;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public List<Integer> getCompetitionExternalIds() {
        return competitionExternalIds;
    }

    public void setCompetitionExternalIds(List<Integer> competitionExternalIds) {
        this.competitionExternalIds = competitionExternalIds;
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
