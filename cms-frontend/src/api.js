import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export const getSecureClient = async (getAccessTokenSilently) => {
    const token = await getAccessTokenSilently();
    return axios.create({
        baseURL: API_BASE_URL,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
};
