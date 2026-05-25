package com.footyiq.api.controller;

import com.footyiq.api.model.MatchEvent;
import com.footyiq.api.service.EventingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventingController {

    private final EventingService eventingService;

    public EventingController(EventingService eventingService) {
        this.eventingService = eventingService;
    }

    @PostMapping
    public MatchEvent create(Authentication authentication, @RequestBody MatchEvent event) {
        return eventingService.createEvent(authentication.getName(), event);
    }

    @GetMapping
    public List<MatchEvent> list(Authentication authentication, @RequestParam String matchId) {
        return eventingService.getEvents(authentication.getName(), matchId);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MatchEvent> update(Authentication authentication, @PathVariable String id,
            @RequestBody MatchEvent payload) {
        MatchEvent updated = eventingService.updateEvent(authentication.getName(), id, payload);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(Authentication authentication, @PathVariable String id) {
        boolean removed = eventingService.deleteEvent(authentication.getName(), id);
        return removed ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
