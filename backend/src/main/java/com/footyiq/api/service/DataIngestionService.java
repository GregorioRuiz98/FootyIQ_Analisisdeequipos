package com.footyiq.api.service;

import com.footyiq.api.model.DataImportRun;
import com.footyiq.api.model.ImportedCompetition;
import com.footyiq.api.model.ImportedMatch;
import com.footyiq.api.model.ImportedPlayer;
import com.footyiq.api.model.ImportedTeam;
import com.footyiq.api.repository.DataImportRunRepository;
import com.footyiq.api.repository.ImportedCompetitionRepository;
import com.footyiq.api.repository.ImportedMatchRepository;
import com.footyiq.api.repository.ImportedPlayerRepository;
import com.footyiq.api.repository.ImportedTeamRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class DataIngestionService {

    private final FotmobDataService fotmobDataService;
    private final ImportedCompetitionRepository competitionRepository;
    private final ImportedTeamRepository teamRepository;
    private final ImportedPlayerRepository playerRepository;
    private final ImportedMatchRepository matchRepository;
    private final DataImportRunRepository importRunRepository;

    public DataIngestionService(
            FotmobDataService fotmobDataService,
            ImportedCompetitionRepository competitionRepository,
            ImportedTeamRepository teamRepository,
            ImportedPlayerRepository playerRepository,
            ImportedMatchRepository matchRepository,
            DataImportRunRepository importRunRepository) {
        this.fotmobDataService = fotmobDataService;
        this.competitionRepository = competitionRepository;
        this.teamRepository = teamRepository;
        this.playerRepository = playerRepository;
        this.matchRepository = matchRepository;
        this.importRunRepository = importRunRepository;
    }

    public DataImportRun importLeagueToDatabase(int leagueId, String username) {
        DataImportRun run = new DataImportRun();
        run.setLeagueExternalId(leagueId);
        run.setUsername(username);
        run.setStatus("RUNNING");
        run.setStartedAt(Instant.now());
        run = importRunRepository.save(run);

        try {
            Map<String, Object> leaguePayload = fotmobDataService.getLeagueData(leagueId);
            Map<String, Object> leagueData = mapOf(leaguePayload.get("data"));
            Map<String, Object> details = mapOf(leagueData.get("details"));

            String leagueName = stringOf(details.get("name"), "League " + leagueId);
            run.setLeagueName(leagueName);

            upsertCompetition(leagueId, leagueName, details);

            Map<String, Object> leagueMatchesPayload = fotmobDataService.getLeagueMatchesData(leagueId);
            Map<String, Object> entityData = mapOf(leagueMatchesPayload.get("data"));
            Map<String, Object> wrapperData = mapOf(entityData.get("data"));
            List<Map<String, Object>> matches = listOfMap(wrapperData.get("matches"));
            if (matches.isEmpty()) {
                matches = listOfMap(entityData.get("matches"));
            }

            Set<Integer> uniqueTeams = new HashSet<>();
            int importedMatches = 0;
            for (Map<String, Object> match : matches) {
                Integer matchId = intOf(match.get("id"));
                if (matchId == null) {
                    continue;
                }

                Map<String, Object> home = mapOf(match.get("home"));
                Map<String, Object> away = mapOf(match.get("away"));
                Map<String, Object> status = mapOf(match.get("status"));

                Integer homeTeamId = intOf(home.get("id"));
                Integer awayTeamId = intOf(away.get("id"));

                upsertTeam(homeTeamId, stringOf(home.get("name"), "Unknown"), stringOf(home.get("shortName"), null),
                        leagueId);
                upsertTeam(awayTeamId, stringOf(away.get("name"), "Unknown"), stringOf(away.get("shortName"), null),
                        leagueId);

                if (homeTeamId != null)
                    uniqueTeams.add(homeTeamId);
                if (awayTeamId != null)
                    uniqueTeams.add(awayTeamId);

                Optional<ImportedMatch> existing = matchRepository.findByExternalId(matchId);
                ImportedMatch dbMatch = existing.orElseGet(ImportedMatch::new);
                dbMatch.setExternalId(matchId);
                dbMatch.setLeagueExternalId(leagueId);
                dbMatch.setLeagueName(leagueName);
                dbMatch.setRound(stringOf(match.get("round"), null));
                dbMatch.setHomeTeamExternalId(homeTeamId);
                dbMatch.setHomeTeamName(stringOf(home.get("name"), null));
                dbMatch.setAwayTeamExternalId(awayTeamId);
                dbMatch.setAwayTeamName(stringOf(away.get("name"), null));
                dbMatch.setHomeScore(intOf(match.get("homeScore")));
                dbMatch.setAwayScore(intOf(match.get("awayScore")));
                dbMatch.setScoreStr(stringOf(status.get("scoreStr"), null));
                dbMatch.setUtcTime(stringOf(status.get("utcTime"), null));
                dbMatch.setStatus(stringOf(mapOf(status.get("reason")).get("short"), null));
                dbMatch.setPageUrl(stringOf(match.get("pageUrl"), null));
                dbMatch.setLastImportedAt(Instant.now());
                matchRepository.save(dbMatch);
                importedMatches++;
            }

            int importedPlayers = 0;
            int removedPlayers = 0;
            for (Integer teamId : uniqueTeams) {
                if (teamId == null) {
                    continue;
                }
                Map<String, Object> teamPlayersPayload = fotmobDataService.getTeamPlayersData(teamId);
                Map<String, Object> teamPlayersEntity = mapOf(teamPlayersPayload.get("data"));
                Map<String, Object> teamPlayersData = mapOf(teamPlayersEntity.get("data"));
                List<Map<String, Object>> players = listOfMap(teamPlayersData.get("players"));
                if (players.isEmpty()) {
                    players = listOfMap(teamPlayersEntity.get("players"));
                }

                String teamName = stringOf(teamPlayersData.get("teamName"), null);
                if (teamName == null) {
                    Optional<ImportedTeam> team = teamRepository.findByExternalId(teamId);
                    teamName = team.map(ImportedTeam::getName).orElse(null);
                }

                Set<Integer> freshIds = new HashSet<>();
                for (Map<String, Object> player : players) {
                    Integer playerId = intOf(player.get("id"));
                    if (playerId == null) {
                        continue;
                    }
                    freshIds.add(playerId);
                    Optional<ImportedPlayer> existing = playerRepository.findByExternalId(playerId);
                    ImportedPlayer dbPlayer = existing.orElseGet(ImportedPlayer::new);
                    dbPlayer.setExternalId(playerId);
                    dbPlayer.setName(stringOf(player.get("name"), "Unknown"));
                    dbPlayer.setTeamExternalId(teamId);
                    dbPlayer.setTeamName(teamName);
                    dbPlayer.setSection(stringOf(player.get("section"), stringOf(player.get("title"), null)));
                    dbPlayer.setShirtNumber(intOf(player.get("shirtNumber")));
                    dbPlayer.setAge(intOf(player.get("age")));
                    dbPlayer.setNationality(stringOf(player.get("cname"), null));
                    Map<String, Object> role = mapOf(player.get("role"));
                    dbPlayer.setRole(stringOf(role.get("fallback"), null));
                    dbPlayer.setLastImportedAt(Instant.now());
                    playerRepository.save(dbPlayer);
                    importedPlayers++;
                }

                // Limpia jugadores que FotMob ya no devuelve para este equipo (IDs huerfanos).
                if (!freshIds.isEmpty()) {
                    List<ImportedPlayer> currentTeamPlayers = playerRepository.findByTeamExternalId(teamId);
                    for (ImportedPlayer p : currentTeamPlayers) {
                        Integer ext = p.getExternalId();
                        if (ext != null && !freshIds.contains(ext)) {
                            playerRepository.delete(p);
                            removedPlayers++;
                        }
                    }
                }
            }

            run.setImportedMatches(importedMatches);
            run.setImportedTeams(uniqueTeams.size());
            run.setImportedPlayers(importedPlayers);
            run.setStatus("SUCCESS");
            run.setMessage("Import completed (removed " + removedPlayers + " stale players)");
            run.setFinishedAt(Instant.now());
            return importRunRepository.save(run);
        } catch (Exception ex) {
            run.setStatus("FAILED");
            run.setMessage(ex.getMessage());
            run.setFinishedAt(Instant.now());
            return importRunRepository.save(run);
        }
    }

    public List<DataImportRun> latestImports() {
        return importRunRepository.findTop10ByOrderByStartedAtDesc();
    }

    public Map<String, Object> deleteLeague(int leagueId) {
        long deletedMatches = matchRepository.deleteByLeagueExternalId(leagueId);

        // Para cada equipo que pertenecia a la liga: quitar el id de su lista.
        // Si el equipo se queda sin competiciones lo borramos y a sus jugadores.
        List<ImportedTeam> teams = teamRepository.findByCompetitionExternalIdsContains(leagueId);
        long deletedTeams = 0;
        long deletedPlayers = 0;
        for (ImportedTeam team : teams) {
            List<Integer> ids = team.getCompetitionExternalIds() == null
                    ? new ArrayList<>()
                    : new ArrayList<>(team.getCompetitionExternalIds());
            ids.removeIf(id -> id != null && id == leagueId);
            if (ids.isEmpty()) {
                Integer teamExt = team.getExternalId();
                if (teamExt != null) {
                    List<ImportedPlayer> players = playerRepository.findByTeamExternalId(teamExt);
                    for (ImportedPlayer p : players) {
                        playerRepository.delete(p);
                        deletedPlayers++;
                    }
                }
                teamRepository.delete(team);
                deletedTeams++;
            } else {
                team.setCompetitionExternalIds(ids);
                teamRepository.save(team);
            }
        }

        long deletedCompetitions = competitionRepository.deleteByExternalId(leagueId);
        long deletedImports = importRunRepository.deleteByLeagueExternalId(leagueId);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("leagueId", leagueId);
        summary.put("deletedCompetitions", deletedCompetitions);
        summary.put("deletedMatches", deletedMatches);
        summary.put("deletedTeams", deletedTeams);
        summary.put("deletedPlayers", deletedPlayers);
        summary.put("deletedImports", deletedImports);
        return summary;
    }

    private void upsertCompetition(int leagueId, String leagueName, Map<String, Object> details) {
        Optional<ImportedCompetition> existing = competitionRepository.findByExternalId(leagueId);
        ImportedCompetition competition = existing.orElseGet(ImportedCompetition::new);
        competition.setExternalId(leagueId);
        competition.setName(leagueName);
        competition.setKey(slugify(leagueName));
        competition.setCountry(stringOf(details.get("country"), "Unknown"));
        competition.setSourceUrl("https://www.fotmob.com/leagues/" + leagueId + "/overview/" + slugify(leagueName));
        competition.setLastImportedAt(Instant.now());
        competitionRepository.save(competition);
    }

    private void upsertTeam(Integer teamId, String name, String shortName, int leagueId) {
        if (teamId == null) {
            return;
        }
        Optional<ImportedTeam> existing = teamRepository.findByExternalId(teamId);
        ImportedTeam team = existing.orElseGet(ImportedTeam::new);
        team.setExternalId(teamId);
        team.setName(name);
        team.setShortName(shortName);
        List<Integer> competitionIds = team.getCompetitionExternalIds() == null
                ? new ArrayList<>()
                : team.getCompetitionExternalIds();
        if (!competitionIds.contains(leagueId)) {
            competitionIds.add(leagueId);
        }
        team.setCompetitionExternalIds(competitionIds);
        team.setLastImportedAt(Instant.now());
        teamRepository.save(team);
    }

    private Map<String, Object> mapOf(Object value) {
        if (value instanceof Map<?, ?> map) {
            Map<String, Object> parsed = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                parsed.put(String.valueOf(entry.getKey()), entry.getValue());
            }
            return parsed;
        }
        return new LinkedHashMap<>();
    }

    private List<Map<String, Object>> listOfMap(Object value) {
        if (value instanceof List<?> list) {
            List<Map<String, Object>> parsed = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Map<?, ?>) {
                    parsed.add(mapOf(item));
                }
            }
            return parsed;
        }
        return new ArrayList<>();
    }

    private Integer intOf(Object value) {
        if (value instanceof Number n) {
            return n.intValue();
        }
        if (value instanceof String s) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ex) {
                return null;
            }
        }
        return null;
    }

    private String stringOf(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String asString = String.valueOf(value).trim();
        return asString.isBlank() ? fallback : asString;
    }

    private String slugify(String input) {
        return input == null ? "league" : input.toLowerCase().replace(" ", "-");
    }
}
