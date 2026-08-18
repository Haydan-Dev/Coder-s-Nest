import axios from 'axios';

export const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Use the Cloudflare tunnel URL
    if (window.location.port !== '5173') {
        return window.location.origin;
    }
    return 'https://alex-money-carbon-flower.trycloudflare.com';
};

export const getWsBaseUrl = () => {
    const baseUrl = getBaseUrl();
    if (baseUrl.startsWith('https://')) return baseUrl.replace('https://', 'wss://');
    if (baseUrl.startsWith('http://')) return baseUrl.replace('http://', 'ws://');
    return 'ws://127.0.0.1:8000';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true, // IMPORTANT: Allows sending and receiving HttpOnly cookies
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        // Automatically attach the access token to every request
        const token = sessionStorage.getItem('cn-access-token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 Unauthorized, and we haven't already retried this request
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call the refresh endpoint (this automatically sends the HttpOnly cookie)
                const res = await axios.post(
                    `${getBaseUrl()}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.access_token;

                // Save the new access token
                sessionStorage.setItem('cn-access-token', newAccessToken);

                // Update the authorization header for the original failed request
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Retry the original request with the new token
                return api(originalRequest);
            } catch (refreshError) {
                // If the refresh token is expired or invalid, log the user out
                sessionStorage.removeItem('cn-access-token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
