package com.DPDP.cms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.beans.factory.annotation.Autowired;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Bean
    public JwtDecoder jwtDecoder() {
        // 1. Create a factory with longer timeouts (e.g., 10 seconds)
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000); // 10 seconds
        factory.setReadTimeout(10000);    // 10 seconds

        // 2. Create the RestTemplate
        RestTemplate restTemplate = new RestTemplate(factory);

        // 3. Configure the Decoder with your issuer URI and the custom template
        return NimbusJwtDecoder.withIssuerLocation("https://dev-m6frsjfbk7k258zu.us.auth0.com/")
                .restOperations(restTemplate)
                .build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource)) // use CorsConfig bean
                .authorizeHttpRequests(auth -> auth

                        // Public — login sync (must be open, JWT still validated inside method)
                        .requestMatchers(HttpMethod.POST, "/users/sync").authenticated()

                        // Any logged-in user can get their own profile
                        .requestMatchers(HttpMethod.GET, "/users/me").authenticated()

                        // Admin-only endpoints
                        .requestMatchers("/users/admin/**").authenticated()
                        .requestMatchers("/api/admin/**").authenticated()

                        // Fiduciary-only endpoints
                        .requestMatchers("/users/fiduciary/**").authenticated()
                        .requestMatchers("/api/fiduciary/**").authenticated()

                        // Worker endpoints
                        .requestMatchers("/api/worker/**").authenticated()

                        // Consent endpoints — any authenticated user
                        .requestMatchers("/api/consent/**").authenticated()

                        // Everything else requires authentication
                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> {}) // validates Auth0 JWT automatically
                );

        return http.build();
    }
}