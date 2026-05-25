package com.footyiq.api.repository;

import com.footyiq.api.model.ImportedMatch;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ImportedMatchRepository extends MongoRepository<ImportedMatch, String> {
    Optional<ImportedMatch> findByExternalId(Integer externalId);
    List<ImportedMatch> findByLeagueExternalIdOrderByUtcTimeDesc(Integer leagueExternalId);
    List<ImportedMatch> findTop25ByOrderByUtcTimeDesc();
    long deleteByLeagueExternalId(Integer leagueExternalId);
}
