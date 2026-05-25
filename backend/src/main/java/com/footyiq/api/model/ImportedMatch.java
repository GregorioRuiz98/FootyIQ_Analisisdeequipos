package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "matches")
public class ImportedMatch {

    @Id
    private String id;
    private Integer externalId;
    private Integer leagueExternalId;
    private String leagueName;
    private String round;
    private Integer homeTeamExternalId;
    private String homeTeamName;
    private Integer awayTeamExternalId;
    private String awayTeamName;
    private Integer homeScore;
    private Integer awayScore;
    private String scoreStr;
    private String utcTime;
    private String status;
    private String pageUrl;
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

    public String getRound() {
        return round;
    }

    public void setRound(String round) {
        this.round = round;
    }

    public Integer getHomeTeamExternalId() {
        return homeTeamExternalId;
    }

    public void setHomeTeamExternalId(Integer homeTeamExternalId) {
        this.homeTeamExternalId = homeTeamExternalId;
    }

    public String getHomeTeamName() {
        return homeTeamName;
    }

    public void setHomeTeamName(String homeTeamName) {
        this.homeTeamName = homeTeamName;
    }

    public Integer getAwayTeamExternalId() {
        return awayTeamExternalId;
    }

    public void setAwayTeamExternalId(Integer awayTeamExternalId) {
        this.awayTeamExternalId = awayTeamExternalId;
    }

    public String getAwayTeamName() {
        return awayTeamName;
    }

    public void setAwayTeamName(String awayTeamName) {
        this.awayTeamName = awayTeamName;
    }

    public Integer getHomeScore() {
        return homeScore;
    }

    public void setHomeScore(Integer homeScore) {
        this.homeScore = homeScore;
    }

    public Integer getAwayScore() {
        return awayScore;
    }

    public void setAwayScore(Integer awayScore) {
        this.awayScore = awayScore;
    }

    public String getScoreStr() {
        return scoreStr;
    }

    public void setScoreStr(String scoreStr) {
        this.scoreStr = scoreStr;
    }

    public String getUtcTime() {
        return utcTime;
    }

    public void setUtcTime(String utcTime) {
        this.utcTime = utcTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public void setPageUrl(String pageUrl) {
        this.pageUrl = pageUrl;
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
