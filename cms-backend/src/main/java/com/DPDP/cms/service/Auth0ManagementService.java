package com.DPDP.cms.service;

import com.auth0.client.auth.AuthAPI;
import com.auth0.client.mgmt.ManagementAPI;
import com.auth0.json.auth.TokenHolder;
import com.auth0.json.mgmt.users.User;
import com.auth0.net.TokenRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;

@Service
public class Auth0ManagementService {

    @Value("${auth0.domain}")
    private String domain;

    @Value("${auth0.management.client-id}")
    private String clientId;

    @Value("${auth0.management.client-secret}")
    private String clientSecret;

    // Fetches a temporary token to securely talk to the Auth0 API
    private String getManagementToken() throws Exception {
        AuthAPI authAPI = AuthAPI.newBuilder(domain, clientId, clientSecret).build();
        TokenRequest request = authAPI.requestToken("https://" + domain + "/api/v2/");
        TokenHolder holder = request.execute().getBody();
        return holder.getAccessToken();
    }

    // Sends the kill command to Auth0
    public void obliterateUser(String auth0UserId) {
        try {
            String token = getManagementToken();
            ManagementAPI managementAPI = ManagementAPI.newBuilder(domain, token).build();
            managementAPI.users().delete(auth0UserId).execute();
            System.out.println("IDENTITY SEVERED: User " + auth0UserId + " permanently deleted from Auth0.");
        } catch (Exception e) {
            throw new RuntimeException("CRITICAL FAILURE: Could not delete user from Auth0 Identity Store", e);
        }
    }

    // NEW: Creates a new user in Auth0 with a temporary password
    // Returns the Auth0 user ID (sub) of the newly created user
    public String createUser(String email, String temporaryPassword) {
        try {
            String token = getManagementToken();
            ManagementAPI managementAPI = ManagementAPI.newBuilder(domain, token).build();

            User newUser = new User("Username-Password-Authentication");
            newUser.setEmail(email);
            newUser.setPassword(temporaryPassword.toCharArray());
            newUser.setEmailVerified(true); // skip verification email — we send our own
            newUser.setAppMetadata(Collections.singletonMap("requiresPasswordChange", true));

            User createdUser = managementAPI.users().create(newUser).execute().getBody();
            System.out.println("Auth0 user created: " + createdUser.getId() + " for " + email);

            return createdUser.getId(); // e.g. auth0|abc123

        } catch (Exception e) {
            // Check if user already exists in Auth0
            if (e.getMessage() != null && e.getMessage().contains("user_exists")) {
                throw new RuntimeException("A user with this email already exists in Auth0.");
            }
            throw new RuntimeException("Failed to create user in Auth0: " + e.getMessage(), e);
        }
    }
}