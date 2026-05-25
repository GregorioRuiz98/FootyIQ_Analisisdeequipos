package com.footyiq.api.repository;

import com.footyiq.api.model.Favorite;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends MongoRepository<Favorite, String> {

    List<Favorite> findByUsernameOrderByCreatedAtDesc(String username);

    List<Favorite> findByUsernameAndTypeOrderByCreatedAtDesc(String username, String type);

    Optional<Favorite> findByUsernameAndTypeAndExternalId(String username, String type, Long externalId);

    long deleteByUsernameAndTypeAndExternalId(String username, String type, Long externalId);
}
