package com.footyiq.api.repository;

import com.footyiq.api.model.ManualMatch;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ManualMatchRepository extends MongoRepository<ManualMatch, String> {
    List<ManualMatch> findByOwnerUsernameOrderByUpdatedAtDesc(String ownerUsername);
}
