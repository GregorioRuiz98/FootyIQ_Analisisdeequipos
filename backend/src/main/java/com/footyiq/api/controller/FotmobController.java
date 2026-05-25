package com.footyiq.api.controller;

import com.footyiq.api.service.FotmobDataService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/fotmob")
public class FotmobController {

    private final FotmobDataService fotmobDataService;

    public FotmobController(FotmobDataService fotmobDataService) {
        this.fotmobDataService = fotmobDataService;
    }

    @GetMapping("/catalog/leagues")
    public Map<String, Object> mainLeaguesCatalog() {
        return fotmobDataService.getMainLeaguesCatalog();
    }

    @GetMapping("/league/{leagueId}")
    public Map<String, Object> league(@PathVariable int leagueId) {
        return fotmobDataService.getLeagueData(leagueId);
    }

    @GetMapping("/team/{teamId}")
    public Map<String, Object> team(@PathVariable int teamId) {
        return fotmobDataService.getTeamData(teamId);
    }

    @GetMapping("/team/{teamId}/players")
    public Map<String, Object> teamPlayers(@PathVariable int teamId) {
        return fotmobDataService.getTeamPlayersData(teamId);
    }

    @GetMapping("/player/{playerId}")
    public Map<String, Object> player(@PathVariable int playerId, @RequestParam(required = false) Integer teamId) {
        return fotmobDataService.getPlayerData(playerId, teamId);
    }

    @GetMapping("/match/{matchId}")
    public Map<String, Object> match(@PathVariable int matchId, @RequestParam(required = false) Integer leagueId) {
        return fotmobDataService.getMatchData(matchId, leagueId);
    }

    @GetMapping("/matches")
    public Map<String, Object> matchesByDate(@RequestParam(required = false) String date) {
        return fotmobDataService.getMatchesByDate(date);
    }

    @GetMapping("/league/{leagueId}/matches")
    public Map<String, Object> leagueMatches(@PathVariable int leagueId) {
        return fotmobDataService.getLeagueMatchesData(leagueId);
    }
}
