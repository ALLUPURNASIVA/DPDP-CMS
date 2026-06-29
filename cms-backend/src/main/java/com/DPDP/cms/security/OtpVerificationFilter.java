package com.DPDP.cms.security;

import com.DPDP.cms.entity.User;
import com.DPDP.cms.repository.GeneralUserOtpRepository;
import com.DPDP.cms.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class OtpVerificationFilter extends OncePerRequestFilter {

    private static final Set<String> OTP_REQUIRED_ROLES = Set.of("GENERAL_USER", "FIDUCIARY_WORKER");

    private static final List<String> OTP_ALLOWED_PATHS = List.of(
            "/api/users/sync",
            "/api/users/me",
            "/api/user-otp/"
    );

    private final UserRepository userRepo;
    private final GeneralUserOtpRepository otpRepo;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getServletPath();
        return OTP_ALLOWED_PATHS.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            filterChain.doFilter(request, response);
            return;
        }

        String userId = jwt.getClaimAsString("sub");
        String email = jwt.getClaimAsString("email");

        Optional<User> userOpt = userRepo.findById(userId);
        if (userOpt.isEmpty()) {
            writeJson(response, HttpServletResponse.SC_FORBIDDEN,
                    "{\"error\":\"User profile is not synced yet.\"}");
            return;
        }

        User user = userOpt.get();
        if (email == null || email.isBlank()) {
            email = user.getEmail();
        }
        if (OTP_REQUIRED_ROLES.contains(user.getRole())) {
            boolean verified = email != null
                    && otpRepo.existsByUserIdAndEmailAndVerifiedAtIsNotNull(userId, email);

            if (!verified) {
                writeJson(response, 428,
                        "{\"error\":\"OTP verification required before accessing this resource.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeJson(HttpServletResponse response, int status, String body) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write(body);
    }
}
