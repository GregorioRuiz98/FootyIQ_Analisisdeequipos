package com.footyiq.api.service;

import com.footyiq.api.model.ManualMatch;
import com.footyiq.api.repository.ManualMatchRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class ManualMatchService {

    private final ManualMatchRepository manualMatchRepository;

    public ManualMatchService(ManualMatchRepository manualMatchRepository) {
        this.manualMatchRepository = manualMatchRepository;
    }

    public List<ManualMatch> list(String username) {
        return manualMatchRepository.findByOwnerUsernameOrderByUpdatedAtDesc(username);
    }

    public ManualMatch get(String username, String id) {
        ManualMatch match = manualMatchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Partido manual no encontrado"));
        ensureOwner(username, match);
        return match;
    }

    public ManualMatch create(String username, ManualMatch payload) {
        ManualMatch match = new ManualMatch();
        match.setOwnerUsername(username);
        applyEditableFields(match, payload);
        Instant now = Instant.now();
        match.setCreatedAt(now);
        match.setUpdatedAt(now);
        return manualMatchRepository.save(match);
    }

    public ManualMatch update(String username, String id, ManualMatch payload) {
        ManualMatch existing = get(username, id);
        applyEditableFields(existing, payload);
        existing.setUpdatedAt(Instant.now());
        return manualMatchRepository.save(existing);
    }

    public void delete(String username, String id) {
        ManualMatch existing = get(username, id);
        manualMatchRepository.deleteById(existing.getId());
    }

    private void ensureOwner(String username, ManualMatch match) {
        if (!username.equals(match.getOwnerUsername())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No puedes acceder a este partido manual");
        }
    }

    private void applyEditableFields(ManualMatch target, ManualMatch source) {
        target.setName(normalize(source.getName()));
        target.setHomeTeamId(normalize(source.getHomeTeamId()));
        target.setHomeTeamName(normalize(source.getHomeTeamName()));
        target.setAwayTeamId(normalize(source.getAwayTeamId()));
        target.setAwayTeamName(normalize(source.getAwayTeamName()));

        target.setHomeStartingXI(copySelections(source.getHomeStartingXI()));
        target.setHomeBench(copySelections(source.getHomeBench()));
        target.setAwayStartingXI(copySelections(source.getAwayStartingXI()));
        target.setAwayBench(copySelections(source.getAwayBench()));

        if (target.getName() == null || target.getName().isBlank()) {
            String home = target.getHomeTeamName() == null ? "Local" : target.getHomeTeamName();
            String away = target.getAwayTeamName() == null ? "Visitante" : target.getAwayTeamName();
            target.setName(home + " vs " + away);
        }
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<ManualMatch.PlayerSelection> copySelections(List<ManualMatch.PlayerSelection> source) {
        if (source == null) {
            return new ArrayList<>();
        }
        List<ManualMatch.PlayerSelection> copied = new ArrayList<>();
        for (ManualMatch.PlayerSelection item : source) {
            ManualMatch.PlayerSelection next = new ManualMatch.PlayerSelection();
            next.setPlayerId(normalize(item.getPlayerId()));
            next.setName(normalize(item.getName()));
            next.setNumber(item.getNumber());
            next.setPosition(normalize(item.getPosition()));
            copied.add(next);
        }
        return copied;
    }
}
