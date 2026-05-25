package com.footyiq.api.controller;

import com.footyiq.api.model.Favorite;
import com.footyiq.api.repository.FavoriteRepository;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private static final Set<String> ALLOWED_TYPES = Set.of("PLAYER", "TEAM", "MATCH");

    private final FavoriteRepository repository;

    public FavoriteController(FavoriteRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Favorite> list(Authentication authentication,
            @RequestParam(value = "type", required = false) String type) {
        String username = authentication.getName();
        if (type != null && !type.isBlank()) {
            return repository.findByUsernameAndTypeOrderByCreatedAtDesc(username, type.toUpperCase());
        }
        return repository.findByUsernameOrderByCreatedAtDesc(username);
    }

    @PostMapping
    public ResponseEntity<?> create(Authentication authentication, @RequestBody Favorite payload) {
        String username = authentication.getName();
        if (payload == null || payload.getType() == null || payload.getExternalId() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "type y externalId son obligatorios"));
        }
        String type = payload.getType().toUpperCase();
        if (!ALLOWED_TYPES.contains(type)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "type debe ser PLAYER, TEAM o MATCH"));
        }
        Favorite existing = repository
                .findByUsernameAndTypeAndExternalId(username, type, payload.getExternalId())
                .orElse(null);
        if (existing != null) {
            return ResponseEntity.ok(existing);
        }
        Favorite fav = new Favorite();
        fav.setUsername(username);
        fav.setType(type);
        fav.setExternalId(payload.getExternalId());
        fav.setName(payload.getName());
        fav.setMetadata(payload.getMetadata() == null ? new HashMap<>() : payload.getMetadata());
        fav.setCreatedAt(Instant.now());
        try {
            return ResponseEntity.ok(repository.save(fav));
        } catch (DuplicateKeyException ex) {
            return ResponseEntity.ok(repository
                    .findByUsernameAndTypeAndExternalId(username, type, payload.getExternalId())
                    .orElse(fav));
        }
    }

    @DeleteMapping("/{type}/{externalId}")
    public ResponseEntity<Void> delete(Authentication authentication,
            @PathVariable String type,
            @PathVariable Long externalId) {
        String username = authentication.getName();
        long removed = repository.deleteByUsernameAndTypeAndExternalId(username, type.toUpperCase(), externalId);
        return removed > 0 ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
