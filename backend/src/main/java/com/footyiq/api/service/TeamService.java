package com.footyiq.api.service;

import com.footyiq.api.config.AppProperties;
import com.footyiq.api.model.CustomTeam;
import com.footyiq.api.model.PlayerProfile;
import com.footyiq.api.repository.CustomTeamRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class TeamService {

    private final CustomTeamRepository customTeamRepository;
    private final AppProperties appProperties;

    public TeamService(CustomTeamRepository customTeamRepository, AppProperties appProperties) {
        this.customTeamRepository = customTeamRepository;
        this.appProperties = appProperties;
    }

    public List<CustomTeam> listTeams(String username) {
        return customTeamRepository.findByOwnerUsernameOrSharedTrue(username);
    }

    public CustomTeam createTeam(String username, String name, boolean shared, MultipartFile logo) {
        String sanitizedName = name == null ? "" : name.trim();
        if (sanitizedName.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre del equipo es obligatorio");
        }

        CustomTeam team = new CustomTeam();
        team.setOwnerUsername(username);
        team.setName(sanitizedName);
        team.setShared(shared);
        team.setLogoPath(storeFile("logos", logo));
        return customTeamRepository.save(team);
    }

    public CustomTeam addPlayer(String username, String teamId, PlayerProfile player, MultipartFile photo) {
        CustomTeam team = customTeamRepository.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipo no encontrado"));

        if (!team.getOwnerUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes modificar este equipo");
        }

        player.setId(UUID.randomUUID().toString());
        if (photo != null && !photo.isEmpty()) {
            player.setPhotoPath(storeFile("players", photo));
        }
        if (team.getPlayers() == null) {
            team.setPlayers(new ArrayList<>());
        }
        team.getPlayers().add(player);
        return customTeamRepository.save(team);
    }

    private String storeFile(String section, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }
        try {
            Path basePath = Paths.get(appProperties.getUploadsPath(), section);
            Files.createDirectories(basePath);
            String extension = extractExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + extension;
            Path destination = basePath.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + section + "/" + filename;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "No se pudo guardar el archivo");
        }
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
