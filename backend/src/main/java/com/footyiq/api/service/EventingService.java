package com.footyiq.api.service;

import com.footyiq.api.model.MatchEvent;
import com.footyiq.api.repository.MatchEventRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EventingService {

    private final MatchEventRepository matchEventRepository;

    public EventingService(MatchEventRepository matchEventRepository) {
        this.matchEventRepository = matchEventRepository;
    }

    public MatchEvent createEvent(String username, MatchEvent event) {
        event.setId(null);
        event.setOwnerUsername(username);
        return matchEventRepository.save(event);
    }

    public List<MatchEvent> getEvents(String username, String matchId) {
        return matchEventRepository.findByOwnerUsernameAndMatchIdOrderByMinuteAscSecondAsc(username, matchId);
    }

    public boolean deleteEvent(String username, String eventId) {
        return matchEventRepository.findById(eventId)
                .filter(e -> username.equals(e.getOwnerUsername()))
                .map(e -> {
                    matchEventRepository.deleteById(eventId);
                    return true;
                })
                .orElse(false);
    }

    public MatchEvent updateEvent(String username, String eventId, MatchEvent payload) {
        return matchEventRepository.findById(eventId)
                .filter(e -> username.equals(e.getOwnerUsername()))
                .map(existing -> {
                    if (payload.getEventType() != null)
                        existing.setEventType(payload.getEventType());
                    existing.setMinute(payload.getMinute());
                    existing.setSecond(payload.getSecond());
                    existing.setX(payload.getX());
                    existing.setY(payload.getY());
                    existing.setEndX(payload.getEndX());
                    existing.setEndY(payload.getEndY());
                    if (payload.getTeamId() != null)
                        existing.setTeamId(payload.getTeamId());
                    if (payload.getPlayerName() != null)
                        existing.setPlayerName(payload.getPlayerName());
                    existing.setOutcome(payload.getOutcome());
                    existing.setNotes(payload.getNotes());
                    return matchEventRepository.save(existing);
                })
                .orElse(null);
    }
}
