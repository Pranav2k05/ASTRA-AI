package com.astra.assistant.config;

import com.astra.assistant.service.ConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.security.MessageDigest;

@Component
public class SecurityInterceptor implements HandlerInterceptor {

    @Autowired
    private ConfigService configService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Allow OPTIONS requests for CORS preflight (if CORS is needed, e.g. for development server)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String requestUri = request.getRequestURI();
        
        // Only protect API endpoints. Static resources do not require the token.
        if (requestUri.startsWith("/api/")) {
            String clientToken = request.getHeader("X-ASTRA-Token");
            String serverToken = configService.getSessionToken();

            if (clientToken == null || !safeEquals(clientToken, serverToken)) {
                response.setStatus(HttpStatus.UNAUTHORIZED.value());
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Unauthorized. Invalid or missing ASTRA security token.\"}");
                return false;
            }
        }

        return true;
    }

    /**
     * Constant-time comparison to prevent timing attacks.
     */
    private boolean safeEquals(String a, String b) {
        byte[] aBytes = a.getBytes();
        byte[] bBytes = b.getBytes();
        return MessageDigest.isEqual(aBytes, bBytes);
    }
}
