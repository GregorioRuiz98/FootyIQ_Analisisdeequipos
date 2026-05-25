package com.footyiq.api.service;

import com.footyiq.api.auth.JwtTokenService;
import com.footyiq.api.dto.AuthDtos;
import com.footyiq.api.model.UserAccount;
import com.footyiq.api.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    public AuthService(UserAccountRepository userAccountRepository, PasswordEncoder passwordEncoder,
            JwtTokenService jwtTokenService) {
        this.userAccountRepository = userAccountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userAccountRepository.findByUsername(request.username).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El usuario ya existe");
        }
        if (userAccountRepository.findByEmail(request.email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya existe");
        }

        UserAccount user = new UserAccount();
        user.setUsername(request.username);
        user.setEmail(request.email);
        user.setPasswordHash(passwordEncoder.encode(request.password));
        user.setRole("ANALYST");
        userAccountRepository.save(user);

        String token = jwtTokenService.generateToken(user.getUsername());
        return new AuthDtos.AuthResponse(token, user.getUsername(), user.getRole());
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        UserAccount user = userAccountRepository.findByUsername(request.username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (!passwordEncoder.matches(request.password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        String token = jwtTokenService.generateToken(user.getUsername());
        return new AuthDtos.AuthResponse(token, user.getUsername(), user.getRole());
    }
}
