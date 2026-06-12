import axios from 'axios';

export const getSecureClient = async (getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    return axios.create({
        baseURL: 'http://localhost:8080/api', // Your Spring Boot port
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};