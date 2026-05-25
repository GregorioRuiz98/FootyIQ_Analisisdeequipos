package com.footyiq.api.service;

import com.footyiq.api.config.AppProperties;
import com.footyiq.api.model.DashboardSnapshot;
import com.footyiq.api.repository.DashboardSnapshotRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final DashboardSnapshotRepository dashboardSnapshotRepository;
    private final RestTemplate restTemplate;
    private final AppProperties appProperties;
    private final StoredDataQueryService storedDataQueryService;

    public DashboardService(DashboardSnapshotRepository dashboardSnapshotRepository, RestTemplate restTemplate,
            AppProperties appProperties, StoredDataQueryService storedDataQueryService) {
        this.dashboardSnapshotRepository = dashboardSnapshotRepository;
        this.restTemplate = restTemplate;
        this.appProperties = appProperties;
        this.storedDataQueryService = storedDataQueryService;
    }

    public DashboardSnapshot getLatest() {
        Map<String, Object> stored = storedDataQueryService.buildDashboardFromStoredData();
        if (!stored.isEmpty()) {
            DashboardSnapshot snapshot = new DashboardSnapshot();
            snapshot.setCapturedAt(Instant.now());
            snapshot.setMatchesToday((int) stored.getOrDefault("matchesToday", 0));
            snapshot.setActiveAlerts((int) stored.getOrDefault("activeAlerts", 0));
            snapshot.setAnalysisInProgress((int) stored.getOrDefault("analysisInProgress", 0));
            snapshot.setOpportunities((int) stored.getOrDefault("opportunities", 0));
            Object precisionObj = stored.getOrDefault("modelPrecision", 0.0);
            snapshot.setModelPrecision(precisionObj instanceof Number ? ((Number) precisionObj).doubleValue() : 0.0);
            snapshot.setRecentMatches(safeList(stored.get("recentMatches")));
            snapshot.setUpcomingMatches(safeList(stored.get("upcomingMatches")));
            return snapshot;
        }

        return dashboardSnapshotRepository.findTopByOrderByCapturedAtDesc()
                .orElseGet(this::buildFallbackSnapshot);
    }

    public DashboardSnapshot refreshFromScraper() {
        String url = appProperties.getScraperBaseUrl() + "/fotmob/dashboard";
        @SuppressWarnings("unchecked")
        Map<String, Object> payload = restTemplate.getForObject(url, Map.class);
        if (payload == null || payload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No se pudo recuperar informacion del scraper");
        }

        DashboardSnapshot snapshot = new DashboardSnapshot();
        snapshot.setCapturedAt(Instant.now());
        snapshot.setMatchesToday((int) payload.getOrDefault("matchesToday", 0));
        snapshot.setActiveAlerts((int) payload.getOrDefault("activeAlerts", 0));
        snapshot.setAnalysisInProgress((int) payload.getOrDefault("analysisInProgress", 0));
        snapshot.setOpportunities((int) payload.getOrDefault("opportunities", 0));
        Object precisionObj = payload.getOrDefault("modelPrecision", 0.0);
        snapshot.setModelPrecision(precisionObj instanceof Number ? ((Number) precisionObj).doubleValue() : 0.0);

        snapshot.setRecentMatches(safeList(payload.get("recentMatches")));
        snapshot.setUpcomingMatches(safeList(payload.get("upcomingMatches")));

        return dashboardSnapshotRepository.save(snapshot);
    }

    private List<Map<String, Object>> safeList(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> parsed = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?> map) {
                    Map<String, Object> safeMap = new LinkedHashMap<>();
                    for (Map.Entry<?, ?> entry : map.entrySet()) {
                        safeMap.put(String.valueOf(entry.getKey()), entry.getValue());
                    }
                    parsed.add(safeMap);
                }
            }
            return parsed;
        }
        return new ArrayList<>();
    }

    private DashboardSnapshot buildFallbackSnapshot() {
        DashboardSnapshot snapshot = new DashboardSnapshot();
        snapshot.setCapturedAt(Instant.now());
        snapshot.setMatchesToday(24);
        snapshot.setActiveAlerts(8);
        snapshot.setAnalysisInProgress(5);
        snapshot.setOpportunities(12);
        snapshot.setModelPrecision(76.0);
        snapshot.setRecentMatches(List.of(
                Map.of("home", "Manchester City", "away", "Tottenham", "score", "2-1", "league", "Premier League",
                        "status", "Finalizado"),
                Map.of("home", "Athletic Club", "away", "Real Sociedad", "score", "1-0", "league", "LaLiga", "status",
                        "Finalizado"),
                Map.of("home", "Atalanta", "away", "Roma", "score", "3-1", "league", "Serie A", "status",
                        "Finalizado")));
        snapshot.setUpcomingMatches(List.of(
                Map.of("home", "Arsenal", "away", "Everton", "time", "18:30", "priority", "ALTO"),
                Map.of("home", "Barcelona", "away", "Villarreal", "time", "20:00", "priority", "ALTO"),
                Map.of("home", "Bayern", "away", "Hoffenheim", "time", "21:00", "priority", "MEDIO")));
        return dashboardSnapshotRepository.save(snapshot);
    }
}
