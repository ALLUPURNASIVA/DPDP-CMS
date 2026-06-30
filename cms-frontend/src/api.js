import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
