package com.footyiq.api.repository;

import com.footyiq.api.model.ImportedTeam;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ImportedTeamRepository extends MongoRepository<ImportedTeam, String> {
    Optional<ImportedTeam> findByExternalId(Integer externalId);
    List<ImportedTeam> findByCompetitionExternalIdsContains(Integer competitionExternalId);
}
