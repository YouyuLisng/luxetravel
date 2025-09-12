import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    env: {
        AUTH_SECRET: '4c7b8b5f7a8d2f63c9675c593ec9a5c9f7e9d8cf9876e543c1e7f4b5a7c6d8e4',
    },
    images: {
        domains: [
            'avatars.githubusercontent.com',
            'github.com',
            'localhost',
            'qt0qrczeczbveoxc.public.blob.vercel-storage.com',
            'okm2to3vnqmhjqm9.public.blob.vercel-storage.com',
            'example.com',
            'www.example.com',
            'cdn.example.com'
        ],
    },
};

export default nextConfig;
