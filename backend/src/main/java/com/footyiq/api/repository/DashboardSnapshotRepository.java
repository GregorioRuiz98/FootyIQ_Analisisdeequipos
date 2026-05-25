package com.footyiq.api.repository;

import com.footyiq.api.model.DashboardSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DashboardSnapshotRepository extends MongoRepository<DashboardSnapshot, String> {
    Optional<DashboardSnapshot> findTopByOrderByCapturedAtDesc();
}
