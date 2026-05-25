package com.footyiq.api.config;

import com.footyiq.api.model.DashboardSnapshot;
import com.footyiq.api.repository.DashboardSnapshotRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    private final DashboardSnapshotRepository dashboardSnapshotRepository;

    public DataSeeder(DashboardSnapshotRepository dashboardSnapshotRepository) {
        this.dashboardSnapshotRepository = dashboardSnapshotRepository;
    }

    @Override
    public void run(String... args) {
        if (dashboardSnapshotRepository.count() > 0) {
            return;
        }

        DashboardSnapshot snapshot = new DashboardSnapshot();
        snapshot.setCapturedAt(Instant.now());
        snapshot.setMatchesToday(24);
        snapshot.setActiveAlerts(8);
        snapshot.setAnalysisInProgress(5);
        snapshot.setOpportunities(12);
        snapshot.setModelPrecision(76);
        snapshot.setRecentMatches(List.of(
                Map.of("home", "Manchester City", "away", "Tottenham", "score", "2-1", "league", "Premier League", "status", "Finalizado"),
                Map.of("home", "Athletic Club", "away", "Real Sociedad", "score", "1-0", "league", "LaLiga", "status", "Finalizado"),
                Map.of("home", "Atalanta", "away", "Roma", "score", "3-1", "league", "Serie A", "status", "Finalizado")
        ));
        snapshot.setUpcomingMatches(List.of(
                Map.of("home", "Arsenal", "away", "Everton", "time", "18:30", "priority", "ALTO"),
                Map.of("home", "Barcelona", "away", "Villarreal", "time", "20:00", "priority", "ALTO"),
                Map.of("home", "Bayern", "away", "Hoffenheim", "time", "21:00", "priority", "MEDIO")
        ));
        dashboardSnapshotRepository.save(snapshot);
    }
}
