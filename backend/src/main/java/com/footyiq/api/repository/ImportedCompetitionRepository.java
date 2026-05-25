package com.footyiq.api.repository;

import com.footyiq.api.model.ImportedCompetition;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ImportedCompetitionRepository extends MongoRepository<ImportedCompetition, String> {
    Optional<ImportedCompetition> findByExternalId(Integer externalId);
    long deleteByExternalId(Integer externalId);
}
