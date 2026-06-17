import axios from 'axios';

// Create a custom axios instance
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000',
    withCredentials: true, // IMPORTANT: Allows sending and receiving HttpOnly cookies
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        // Automatically attach the access token to every request
        const token = localStorage.getItem('cn-access-token');
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
                    'http://127.0.0.1:8000/auth/refresh',
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = res.data.access_token;

                // Save the new access token
                localStorage.setItem('cn-access-token', newAccessToken);

                // Update the authorization header for the original failed request
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Retry the original request with the new token
                return api(originalRequest);
            } catch (refreshError) {
                // If the refresh token is expired or invalid, log the user out
                localStorage.removeItem('cn-access-token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
