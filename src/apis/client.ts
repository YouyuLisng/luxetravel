import axios from 'axios';

const baseURL = `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_PATH}`;

const axiosInstance = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

axiosInstance.interceptors.request.use(
    (config) => {
        // TODO: add token
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;
