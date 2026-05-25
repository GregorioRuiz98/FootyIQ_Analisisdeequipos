package com.footyiq.api.controller;

import com.footyiq.api.model.CustomTeam;
import com.footyiq.api.model.PlayerProfile;
import com.footyiq.api.service.TeamService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teamService;

    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public List<CustomTeam> list(Authentication authentication) {
        return teamService.listTeams(authentication.getName());
    }

    @PostMapping(consumes = { "multipart/form-data" })
    public CustomTeam create(
            Authentication authentication,
            @RequestParam String name,
            @RequestParam(defaultValue = "false") boolean shared,
            @RequestParam(required = false) MultipartFile logo) {
        return teamService.createTeam(authentication.getName(), name, shared, logo);
    }

    @PostMapping(value = "/{teamId}/players", consumes = { "multipart/form-data" })
    public CustomTeam addPlayer(
            Authentication authentication,
            @PathVariable String teamId,
            @RequestParam String name,
            @RequestParam(defaultValue = "0") int number,
            @RequestParam String position,
            @RequestParam(defaultValue = "Right") String preferredFoot,
            @RequestParam(required = false) String birthDate,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) MultipartFile photo) {
        PlayerProfile player = new PlayerProfile();
        player.setName(name);
        player.setNumber(number);
        player.setPosition(position);
        player.setPreferredFoot(preferredFoot);
        player.setBirthDate(birthDate);
        player.setNotes(notes);
        return teamService.addPlayer(authentication.getName(), teamId, player, photo);
    }
}
