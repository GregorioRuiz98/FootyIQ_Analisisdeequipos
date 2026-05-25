package com.footyiq.api.repository;

import com.footyiq.api.model.ImportedPlayer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ImportedPlayerRepository extends MongoRepository<ImportedPlayer, String> {
    Optional<ImportedPlayer> findByExternalId(Integer externalId);
    List<ImportedPlayer> findByTeamExternalId(Integer teamExternalId);
}
