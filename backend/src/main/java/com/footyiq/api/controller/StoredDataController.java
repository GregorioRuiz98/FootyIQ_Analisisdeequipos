package com.footyiq.api.controller;

import com.footyiq.api.model.DataImportRun;
import com.footyiq.api.model.ImportedCompetition;
import com.footyiq.api.model.ImportedMatch;
import com.footyiq.api.model.ImportedPlayer;
import com.footyiq.api.model.ImportedTeam;
import com.footyiq.api.service.DataIngestionService;
import com.footyiq.api.service.StoredDataQueryService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/data")
public class StoredDataController {

    private final DataIngestionService ingestionService;
    private final StoredDataQueryService queryService;

    public StoredDataController(DataIngestionService ingestionService, StoredDataQueryService queryService) {
        this.ingestionService = ingestionService;
        this.queryService = queryService;
    }

    @PostMapping("/import/league/{leagueId}")
    public DataImportRun importLeague(@PathVariable int leagueId, Authentication authentication) {
        return ingestionService.importLeagueToDatabase(leagueId, authentication.getName());
    }

    @DeleteMapping("/competition/{leagueId}")
    public Map<String, Object> deleteLeague(@PathVariable int leagueId) {
        return ingestionService.deleteLeague(leagueId);
    }

    @GetMapping("/imports")
    public List<DataImportRun> latestImports() {
        return ingestionService.latestImports();
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboardFromStored() {
        return queryService.buildDashboardFromStoredData();
    }

    @GetMapping("/competitions")
    public List<ImportedCompetition> competitions() {
        return queryService.competitions();
    }

    @GetMapping("/competition/{leagueId}/matches")
    public List<ImportedMatch> matchesByLeague(@PathVariable int leagueId) {
        return queryService.matchesByLeague(leagueId);
    }

    @GetMapping("/competition/{leagueId}/teams")
    public List<ImportedTeam> teamsByLeague(@PathVariable int leagueId) {
        return queryService.teamsByLeague(leagueId);
    }

    @GetMapping("/team/{teamId}/players")
    public List<ImportedPlayer> playersByTeam(@PathVariable int teamId) {
        return queryService.playersByTeam(teamId);
    }

    @GetMapping("/player/{playerId}")
    public ImportedPlayer playerByExternalId(@PathVariable int playerId) {
        return queryService.playerByExternalId(playerId).orElse(null);
    }

    @GetMapping("/match/{matchId}")
    public ImportedMatch matchByExternalId(@PathVariable int matchId) {
        return queryService.matchByExternalId(matchId).orElse(null);
    }
}
