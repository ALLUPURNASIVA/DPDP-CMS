package com.DPDP.cms.service;

import com.auth0.client.auth.AuthAPI;
import com.auth0.client.mgmt.ManagementAPI;
import com.auth0.json.auth.TokenHolder;
import com.auth0.net.TokenRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

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

            // Execute the hard delete
            managementAPI.users().delete(auth0UserId).execute();
            System.out.println("🚨 IDENTITY SEVERED: User " + auth0UserId + " permanently deleted from Auth0.");

        } catch (Exception e) {
            throw new RuntimeException("CRITICAL FAILURE: Could not delete user from Auth0 Identity Store", e);
        }
    }
}