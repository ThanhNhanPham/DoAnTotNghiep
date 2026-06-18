package com.example.smartgarage.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private final JwtTokenProvider jwtTokenProvider = new JwtTokenProvider();

    @Test
    void validateToken_withValidToken_returnsTrueAndNotExpired() {
        String token = jwtTokenProvider.generateToken("customer@example.com");

        assertTrue(jwtTokenProvider.validateToken(token));
        assertFalse(jwtTokenProvider.isTokenExpired(token));
    }

    @Test
    void validateToken_withExpiredToken_returnsFalseAndExpired() {
        String token = jwtTokenProvider.generateToken("customer@example.com", -1000L);

        assertFalse(jwtTokenProvider.validateToken(token));
        assertTrue(jwtTokenProvider.isTokenExpired(token));
    }
}
