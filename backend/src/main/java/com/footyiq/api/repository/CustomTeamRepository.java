package com.footyiq.api.repository;

import com.footyiq.api.model.CustomTeam;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CustomTeamRepository extends MongoRepository<CustomTeam, String> {
    List<CustomTeam> findByOwnerUsernameOrSharedTrue(String ownerUsername);
}
