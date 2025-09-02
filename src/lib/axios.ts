// lib/axios.ts
import axios from 'axios';

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

instance.interceptors.request.use(
    (config) => {
        const token =
            typeof window !== 'undefined'
                ? localStorage.getItem('token')
                : null;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ❗ Response 攔截器（統一處理錯誤）
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status } = error.response;

            if (status === 401) {
                console.warn('未授權，請重新登入');
                // 可導向登入頁或清除 localStorage
            }

            if (status >= 500) {
                console.error('伺服器錯誤，請稍後再試');
            }
        }
        return Promise.reject(error);
    }
);

export default instance;
