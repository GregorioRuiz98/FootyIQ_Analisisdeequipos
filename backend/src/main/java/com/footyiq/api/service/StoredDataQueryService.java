package com.footyiq.api.service;

import com.footyiq.api.model.ImportedCompetition;
import com.footyiq.api.model.ImportedMatch;
import com.footyiq.api.model.ImportedPlayer;
import com.footyiq.api.model.ImportedTeam;
import com.footyiq.api.repository.ImportedCompetitionRepository;
import com.footyiq.api.repository.ImportedMatchRepository;
import com.footyiq.api.repository.ImportedPlayerRepository;
import com.footyiq.api.repository.ImportedTeamRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StoredDataQueryService {

    private final ImportedCompetitionRepository competitionRepository;
    private final ImportedTeamRepository teamRepository;
    private final ImportedPlayerRepository playerRepository;
    private final ImportedMatchRepository matchRepository;

    public StoredDataQueryService(
            ImportedCompetitionRepository competitionRepository,
            ImportedTeamRepository teamRepository,
            ImportedPlayerRepository playerRepository,
            ImportedMatchRepository matchRepository) {
        this.competitionRepository = competitionRepository;
        this.teamRepository = teamRepository;
        this.playerRepository = playerRepository;
        this.matchRepository = matchRepository;
    }

    public List<ImportedCompetition> competitions() {
        return competitionRepository.findAll();
    }

    public List<ImportedMatch> matchesByLeague(int leagueId) {
        return matchRepository.findByLeagueExternalIdOrderByUtcTimeDesc(leagueId);
    }

    public List<ImportedTeam> teamsByLeague(int leagueId) {
        return teamRepository.findByCompetitionExternalIdsContains(leagueId);
    }

    public List<ImportedPlayer> playersByTeam(int teamId) {
        return playerRepository.findByTeamExternalId(teamId);
    }

    public Optional<ImportedPlayer> playerByExternalId(int playerId) {
        return playerRepository.findByExternalId(playerId);
    }

    public Optional<ImportedMatch> matchByExternalId(int matchId) {
        return matchRepository.findByExternalId(matchId);
    }

    public Map<String, Object> buildDashboardFromStoredData() {
        List<ImportedMatch> allMatches = matchRepository.findAll();
        if (allMatches.isEmpty()) {
            return Map.of();
        }

        Instant now = Instant.now();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        int matchesToday = 0;
        List<ImportedMatch> ordered = new ArrayList<>(allMatches);
        ordered.sort(Comparator.comparing(
                match -> parseUtcSafe(match.getUtcTime()),
                Comparator.nullsLast(Comparator.reverseOrder())));

        List<Map<String, Object>> recent = new ArrayList<>();
        List<Map<String, Object>> upcoming = new ArrayList<>();

        for (ImportedMatch m : ordered) {
            Instant matchInstant = parseUtcSafe(m.getUtcTime());
            if (matchInstant != null && LocalDate.ofInstant(matchInstant, ZoneOffset.UTC).equals(today)) {
                matchesToday++;
            }

            Map<String, Object> mapped = new LinkedHashMap<>();
            mapped.put("home", m.getHomeTeamName());
            mapped.put("away", m.getAwayTeamName());
            mapped.put("score", m.getScoreStr() == null ? "-" : m.getScoreStr());
            mapped.put("league", m.getLeagueName());
            mapped.put("status", m.getStatus() == null ? "-" : m.getStatus());
            mapped.put("time", m.getUtcTime());
            mapped.put("priority", "MEDIO");

            if (matchInstant != null && matchInstant.isAfter(now)) {
                if (upcoming.size() < 5) {
                    upcoming.add(mapped);
                }
            } else {
                if (recent.size() < 5) {
                    recent.add(mapped);
                }
            }
        }

        return Map.of(
                "matchesToday", matchesToday,
                "activeAlerts", 0,
                "analysisInProgress", 0,
                "opportunities", 0,
                "modelPrecision", 0.0,
                "recentMatches", recent,
                "upcomingMatches", upcoming);
    }

    private Instant parseUtcSafe(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ex) {
            return null;
        }
    }
}
