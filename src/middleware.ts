import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import NextAuth from 'next-auth';
import { getToken } from 'next-auth/jwt';
import authConfig from './authconfig';
import {
    authRoutes,
    publicRoutes,
    apiAuthPrefix,
    DEFAULT_LOGIN_REDIRECT,
} from '@/routes';

const { auth } = NextAuth(authConfig);

const ALLOWED_ORIGINS = [
    'https://luxe-travel.vercel.app',
    'http://localhost:3000',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
        };
    }
    return {
        'Access-Control-Allow-Origin': '',
        'Access-Control-Allow-Methods': '',
        'Access-Control-Allow-Headers': '',
        'Access-Control-Allow-Credentials': '',
    };
}

interface AuthenticatedRequest extends NextRequest {
    auth?: any;
}

export default auth(async (req: AuthenticatedRequest) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

    // ✅ CORS 預檢
    if (req.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: getCorsHeaders(req.headers.get('origin')),
        });
    }

    // 預設加上 CORS
    const res = NextResponse.next({
        headers: getCorsHeaders(req.headers.get('origin')),
    });

    if (isApiAuthRoute) return res;

    // ✅ 僅 ADMIN 可訪問 /dashboard
    if (nextUrl.pathname.startsWith('/dashboard')) {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET });
        if (!token || token.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // ✅ 未登入者只能訪問 publicRoutes + authRoutes
    const isPublic = [...publicRoutes, ...authRoutes].includes(
        nextUrl.pathname
    );
    if (!isLoggedIn && !isPublic) {
        return NextResponse.redirect(new URL('/auth/login', nextUrl));
    }

    // ✅ 已登入者訪問 login/register，導回後台首頁
    if (isLoggedIn && authRoutes.includes(nextUrl.pathname)) {
        return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }

    return res;
});

export const config = {
    matcher: ['/((?!.*\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
