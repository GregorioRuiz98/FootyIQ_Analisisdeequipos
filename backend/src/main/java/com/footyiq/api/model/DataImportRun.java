package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "imports")
public class DataImportRun {

    @Id
    private String id;
    private String username;
    private Integer leagueExternalId;
    private String leagueName;
    private String status;
    private String message;
    private int importedMatches;
    private int importedTeams;
    private int importedPlayers;
    private Instant startedAt = Instant.now();
    private Instant finishedAt;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Integer getLeagueExternalId() {
        return leagueExternalId;
    }

    public void setLeagueExternalId(Integer leagueExternalId) {
        this.leagueExternalId = leagueExternalId;
    }

    public String getLeagueName() {
        return leagueName;
    }

    public void setLeagueName(String leagueName) {
        this.leagueName = leagueName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getImportedMatches() {
        return importedMatches;
    }

    public void setImportedMatches(int importedMatches) {
        this.importedMatches = importedMatches;
    }

    public int getImportedTeams() {
        return importedTeams;
    }

    public void setImportedTeams(int importedTeams) {
        this.importedTeams = importedTeams;
    }

    public int getImportedPlayers() {
        return importedPlayers;
    }

    public void setImportedPlayers(int importedPlayers) {
        this.importedPlayers = importedPlayers;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public void setFinishedAt(Instant finishedAt) {
        this.finishedAt = finishedAt;
    }
}
