package com.footyiq.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {

    public static class RegisterRequest {
        @NotBlank
        public String username;
        @Email
        @NotBlank
        public String email;
        @NotBlank
        public String password;
    }

    public static class LoginRequest {
        @NotBlank
        public String username;
        @NotBlank
        public String password;
    }

    public static class AuthResponse {
        public String token;
        public String username;
        public String role;

        public AuthResponse(String token, String username, String role) {
            this.token = token;
            this.username = username;
            this.role = role;
        }
    }
}
