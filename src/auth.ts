import NextAuth from 'next-auth';
import authConfig from './authconfig';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from './lib/db';
import { getUserById } from './data/user';
type UserRole = 'USER' | 'ADMIN';

export const { handlers, signIn, signOut, auth } = NextAuth({
    pages: {
        signIn: '/auth/login',
        signOut: '/auth/login',
        error: '/auth/error',
    },
    events: {
        async linkAccount({ user }) {
            await db.user.update({
                where: { id: user.id },
                data: { emailVerified: new Date() },
            });
        },
    },
    callbacks: {
        async signIn({ user, account}) {
            if (account?.provider !== 'credentials') return true;
            if (!user.id) return false;
            const existingUser = await getUserById(user.id);
            if (!existingUser?.emailVerified) {
                return false;
            }

            return true;
        },
        async session({ token, session }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }

            if (token.role === "ADMIN" || token.role === "USER") {
                session.user.role = token.role;
            }
            
            
            return session;
        },
        async jwt({ token }) {
            if (!token.sub) return token;
            const user = await getUserById(token.sub);

            if (!user) return token;
            token.role = user.role as UserRole;

            return token;
        },
    },
    adapter: PrismaAdapter(db),
    session: { strategy: 'jwt' },
    ...authConfig,
});
