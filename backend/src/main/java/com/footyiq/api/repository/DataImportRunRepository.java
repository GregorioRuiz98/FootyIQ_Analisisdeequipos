package com.footyiq.api.repository;

import com.footyiq.api.model.DataImportRun;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DataImportRunRepository extends MongoRepository<DataImportRun, String> {
    List<DataImportRun> findTop10ByOrderByStartedAtDesc();
    long deleteByLeagueExternalId(int leagueExternalId);
}
