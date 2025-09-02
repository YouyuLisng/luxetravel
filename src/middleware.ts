import authConfig from './authconfig';
import NextAuth from 'next-auth';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

import {
    authRoutes,
    publicRoutes,
    apiAuthPrefix,
    DEFAULT_LOGIN_REDIRECT,
} from '@/routes';

const { auth } = NextAuth(authConfig);

export default auth(async (req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);

    if (isApiAuthRoute) return;

    // ✅ 僅 ADMIN 可訪問 /dashboard
    if (nextUrl.pathname.startsWith('/dashboard')) {
        const token = await getToken({ req, secret: process.env.AUTH_SECRET });
        if (!token || token.role !== 'ADMIN') {
            console.log('❌ 未授權訪問 /dashboard');
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

    return undefined;
});

export const config = {
    matcher: ['/((?!.*\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
