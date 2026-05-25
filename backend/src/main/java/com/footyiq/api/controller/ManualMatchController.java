package com.footyiq.api.controller;

import com.footyiq.api.model.ManualMatch;
import com.footyiq.api.service.ManualMatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/manual-matches")
public class ManualMatchController {

    private final ManualMatchService manualMatchService;

    public ManualMatchController(ManualMatchService manualMatchService) {
        this.manualMatchService = manualMatchService;
    }

    @GetMapping
    public List<ManualMatch> list(Authentication authentication) {
        return manualMatchService.list(authentication.getName());
    }

    @GetMapping("/{id}")
    public ManualMatch get(Authentication authentication, @PathVariable String id) {
        return manualMatchService.get(authentication.getName(), id);
    }

    @PostMapping
    public ManualMatch create(Authentication authentication, @RequestBody ManualMatch payload) {
        return manualMatchService.create(authentication.getName(), payload);
    }

    @PutMapping("/{id}")
    public ManualMatch update(Authentication authentication, @PathVariable String id,
            @RequestBody ManualMatch payload) {
        return manualMatchService.update(authentication.getName(), id, payload);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String id) {
        manualMatchService.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
