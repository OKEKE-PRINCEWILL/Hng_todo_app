package com.example.todo;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiKeyFilter extends OncePerRequestFilter {
    static final String HEADER_NAME = "X-API-Key";

    private final byte[] expectedKey;

    public ApiKeyFilter(
        @Value("${APP_API_KEY:}") String apiKey,
        @Value("${RENDER:false}") boolean runningOnRender
    ) {
        if (runningOnRender && apiKey.isBlank()) {
            throw new IllegalStateException("APP_API_KEY must be configured when running on Render.");
        }
        if (runningOnRender && apiKey.length() < 32) {
            throw new IllegalStateException("APP_API_KEY must contain at least 32 characters on Render.");
        }
        expectedKey = apiKey.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return expectedKey.length == 0 || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String suppliedKey = request.getHeader(HEADER_NAME);
        byte[] suppliedBytes = suppliedKey == null
            ? new byte[0]
            : suppliedKey.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expectedKey, suppliedBytes)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"Unauthorized.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
