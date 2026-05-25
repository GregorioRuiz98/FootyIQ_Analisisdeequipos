package com.footyiq.api.repository;

import com.footyiq.api.model.MatchEvent;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MatchEventRepository extends MongoRepository<MatchEvent, String> {
    List<MatchEvent> findByOwnerUsernameAndMatchIdOrderByMinuteAscSecondAsc(String ownerUsername, String matchId);
}
