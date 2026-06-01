package com.footyiq.api.config;

import com.footyiq.api.model.UserAccount;
import com.footyiq.api.repository.UserAccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DemoAccountSeeder implements CommandLineRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(DemoAccountSeeder.class);

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demoAccount.enabled:true}")
    private boolean enabled;

    @Value("${app.demoAccount.username:demo}")
    private String username;

    @Value("${app.demoAccount.email:demo@footyiq.local}")
    private String email;

    @Value("${app.demoAccount.password:123456}")
    private String password;

    @Value("${app.demoAccount.role:ANALYST}")
    private String role;

    public DemoAccountSeeder(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }

        if (userAccountRepository.findByUsername(username).isPresent()) {
            return;
        }

        if (userAccountRepository.findByEmail(email).isPresent()) {
            LOGGER.warn("No se crea cuenta demo: el email {} ya existe con otro usuario", email);
            return;
        }

        UserAccount demo = new UserAccount();
        demo.setUsername(username);
        demo.setEmail(email);
        demo.setPasswordHash(passwordEncoder.encode(password));
        demo.setRole(role);
        userAccountRepository.save(demo);

        LOGGER.info("Cuenta demo creada automaticamente: {}", username);
    }
}
