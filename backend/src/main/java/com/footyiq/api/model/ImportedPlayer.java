package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "players")
public class ImportedPlayer {

    @Id
    private String id;
    private Integer externalId;
    private String name;
    private Integer teamExternalId;
    private String teamName;
    private String section;
    private Integer shirtNumber;
    private Integer age;
    private String nationality;
    private String role;
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

    public Integer getTeamExternalId() {
        return teamExternalId;
    }

    public void setTeamExternalId(Integer teamExternalId) {
        this.teamExternalId = teamExternalId;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getSection() {
        return section;
    }

    public void setSection(String section) {
        this.section = section;
    }

    public Integer getShirtNumber() {
        return shirtNumber;
    }

    public void setShirtNumber(Integer shirtNumber) {
        this.shirtNumber = shirtNumber;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getNationality() {
        return nationality;
    }

    public void setNationality(String nationality) {
        this.nationality = nationality;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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
