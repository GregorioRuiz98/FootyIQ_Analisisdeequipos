package com.footyiq.api.service;

import com.footyiq.api.config.AppProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@Service
public class FotmobDataService {

    private final RestTemplate restTemplate;
    private final AppProperties appProperties;

    public FotmobDataService(RestTemplate restTemplate, AppProperties appProperties) {
        this.restTemplate = restTemplate;
        this.appProperties = appProperties;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMainLeaguesCatalog() {
        return getOrFail("/fotmob/catalog/leagues");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getLeagueData(int leagueId) {
        return getOrFail("/fotmob/league/" + leagueId);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getTeamData(int teamId) {
        return getOrFail("/fotmob/team/" + teamId);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getTeamPlayersData(int teamId) {
        return getOrFail("/fotmob/team/" + teamId + "/players");
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getPlayerData(int playerId, Integer teamId) {
        String path = "/fotmob/player/" + playerId;
        if (teamId != null) {
            path += "?teamId=" + teamId;
        }
        return getOrFail(path);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMatchData(int matchId, Integer leagueId) {
        String path = "/fotmob/match/" + matchId;
        if (leagueId != null) {
            path += "?leagueId=" + leagueId;
        }
        return getOrFail(path);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getMatchesByDate(String date) {
        String resolvedDate = date;
        if (resolvedDate == null || resolvedDate.isBlank()) {
            resolvedDate = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        }
        return getOrFail("/fotmob/matches?date=" + resolvedDate);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> getLeagueMatchesData(int leagueId) {
        return getOrFail("/fotmob/league/" + leagueId + "/matches");
    }

    private Map<String, Object> getOrFail(String path) {
        String url = appProperties.getScraperBaseUrl() + path;
        Map<String, Object> payload = restTemplate.getForObject(url, Map.class);
        if (payload == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "No response from scraper");
        }
        return payload;
    }
}
