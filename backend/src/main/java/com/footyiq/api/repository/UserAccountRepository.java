package com.footyiq.api.repository;

import com.footyiq.api.model.UserAccount;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserAccountRepository extends MongoRepository<UserAccount, String> {
    Optional<UserAccount> findByUsername(String username);

    Optional<UserAccount> findByEmail(String email);
}
