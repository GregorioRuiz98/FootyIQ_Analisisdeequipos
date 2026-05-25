package com.footyiq.api.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Document(collection = "dashboard_snapshots")
public class DashboardSnapshot {

    @Id
    private String id;
    private Instant capturedAt = Instant.now();
    private int matchesToday;
    private int activeAlerts;
    private int analysisInProgress;
    private int opportunities;
    private double modelPrecision;
    private List<Map<String, Object>> recentMatches = new ArrayList<>();
    private List<Map<String, Object>> upcomingMatches = new ArrayList<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Instant getCapturedAt() {
        return capturedAt;
    }

    public void setCapturedAt(Instant capturedAt) {
        this.capturedAt = capturedAt;
    }

    public int getMatchesToday() {
        return matchesToday;
    }

    public void setMatchesToday(int matchesToday) {
        this.matchesToday = matchesToday;
    }

    public int getActiveAlerts() {
        return activeAlerts;
    }

    public void setActiveAlerts(int activeAlerts) {
        this.activeAlerts = activeAlerts;
    }

    public int getAnalysisInProgress() {
        return analysisInProgress;
    }

    public void setAnalysisInProgress(int analysisInProgress) {
        this.analysisInProgress = analysisInProgress;
    }

    public int getOpportunities() {
        return opportunities;
    }

    public void setOpportunities(int opportunities) {
        this.opportunities = opportunities;
    }

    public double getModelPrecision() {
        return modelPrecision;
    }

    public void setModelPrecision(double modelPrecision) {
        this.modelPrecision = modelPrecision;
    }

    public List<Map<String, Object>> getRecentMatches() {
        return recentMatches;
    }

    public void setRecentMatches(List<Map<String, Object>> recentMatches) {
        this.recentMatches = recentMatches;
    }

    public List<Map<String, Object>> getUpcomingMatches() {
        return upcomingMatches;
    }

    public void setUpcomingMatches(List<Map<String, Object>> upcomingMatches) {
        this.upcomingMatches = upcomingMatches;
    }
}
