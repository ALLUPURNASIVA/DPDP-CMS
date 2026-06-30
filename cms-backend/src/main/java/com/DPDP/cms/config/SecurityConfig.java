package com.DPDP.cms.config;

import com.DPDP.cms.security.OtpVerificationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private CorsConfigurationSource corsConfigurationSource;

    @Autowired
    private OtpVerificationFilter otpVerificationFilter;

    @Bean
    public JwtDecoder jwtDecoder() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(10000);

        RestTemplate restTemplate = new RestTemplate(factory);

        return NimbusJwtDecoder.withIssuerLocation("https://dev-m6frsjfbk7k258zu.us.auth0.com/")
                .restOperations(restTemplate)
                .build();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.POST, "/api/users/sync").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/me").authenticated()

                        .requestMatchers("/api/users/admin/**").authenticated()
                        .requestMatchers("/api/admin/**").authenticated()

                        .requestMatchers("/api/users/fiduciary/**").authenticated()
                        .requestMatchers("/api/fiduciary/**").authenticated()

                        .requestMatchers("/api/worker/**").authenticated()
                        .requestMatchers("/api/consent/**").authenticated()
                        .requestMatchers("/api/user-otp/**").authenticated()

                        .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> {})
                );
        return http.build();
    }
}
