package com.footyiq.api.auth;

import com.footyiq.api.model.UserAccount;
import com.footyiq.api.repository.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final UserAccountRepository userAccountRepository;

    public JwtAuthenticationFilter(JwtTokenService jwtTokenService, UserAccountRepository userAccountRepository) {
        this.jwtTokenService = jwtTokenService;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtTokenService.isValid(token)) {
                String username = jwtTokenService.extractUsername(token);
                UserAccount user = userAccountRepository.findByUsername(username).orElse(null);
                if (user != null) {
                    UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                            user.getUsername(),
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
