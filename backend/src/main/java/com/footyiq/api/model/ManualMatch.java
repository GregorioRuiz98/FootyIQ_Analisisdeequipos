package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "manual_matches")
public class ManualMatch {

    @Id
    private String id;
    private String ownerUsername;
    private String name;

    private String homeTeamId;
    private String homeTeamName;
    private String awayTeamId;
    private String awayTeamName;

    private List<PlayerSelection> homeStartingXI = new ArrayList<>();
    private List<PlayerSelection> homeBench = new ArrayList<>();
    private List<PlayerSelection> awayStartingXI = new ArrayList<>();
    private List<PlayerSelection> awayBench = new ArrayList<>();

    private Instant createdAt = Instant.now();
    private Instant updatedAt = Instant.now();

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

    public String getHomeTeamId() {
        return homeTeamId;
    }

    public void setHomeTeamId(String homeTeamId) {
        this.homeTeamId = homeTeamId;
    }

    public String getHomeTeamName() {
        return homeTeamName;
    }

    public void setHomeTeamName(String homeTeamName) {
        this.homeTeamName = homeTeamName;
    }

    public String getAwayTeamId() {
        return awayTeamId;
    }

    public void setAwayTeamId(String awayTeamId) {
        this.awayTeamId = awayTeamId;
    }

    public String getAwayTeamName() {
        return awayTeamName;
    }

    public void setAwayTeamName(String awayTeamName) {
        this.awayTeamName = awayTeamName;
    }

    public List<PlayerSelection> getHomeStartingXI() {
        return homeStartingXI;
    }

    public void setHomeStartingXI(List<PlayerSelection> homeStartingXI) {
        this.homeStartingXI = homeStartingXI;
    }

    public List<PlayerSelection> getHomeBench() {
        return homeBench;
    }

    public void setHomeBench(List<PlayerSelection> homeBench) {
        this.homeBench = homeBench;
    }

    public List<PlayerSelection> getAwayStartingXI() {
        return awayStartingXI;
    }

    public void setAwayStartingXI(List<PlayerSelection> awayStartingXI) {
        this.awayStartingXI = awayStartingXI;
    }

    public List<PlayerSelection> getAwayBench() {
        return awayBench;
    }

    public void setAwayBench(List<PlayerSelection> awayBench) {
        this.awayBench = awayBench;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public static class PlayerSelection {
        private String playerId;
        private String name;
        private int number;
        private String position;

        public String getPlayerId() {
            return playerId;
        }

        public void setPlayerId(String playerId) {
            this.playerId = playerId;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public int getNumber() {
            return number;
        }

        public void setNumber(int number) {
            this.number = number;
        }

        public String getPosition() {
            return position;
        }

        public void setPosition(String position) {
            this.position = position;
        }
    }
}
