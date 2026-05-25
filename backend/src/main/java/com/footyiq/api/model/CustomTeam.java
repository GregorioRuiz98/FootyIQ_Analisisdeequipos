package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "custom_teams")
public class CustomTeam {

    @Id
    private String id;
    private String ownerUsername;
    private String name;
    private String logoPath;
    private boolean shared;
    private Instant createdAt = Instant.now();
    private List<PlayerProfile> players = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLogoPath() {
        return logoPath;
    }

    public void setLogoPath(String logoPath) {
        this.logoPath = logoPath;
    }

    public boolean isShared() {
        return shared;
    }

    public void setShared(boolean shared) {
        this.shared = shared;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public List<PlayerProfile> getPlayers() {
        return players;
    }

    public void setPlayers(List<PlayerProfile> players) {
        this.players = players;
    }
}
