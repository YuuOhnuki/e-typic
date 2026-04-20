import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getDbClient, ensureDbSchema } from './db/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

declare module 'next-auth' {
    interface User {
        id: string;
        email: string;
        username: string;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            username: string;
        };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    await ensureDbSchema();
                    const db = getDbClient();

                    const result = await db.execute({
                        sql: 'SELECT id, email, username, password_hash FROM users WHERE email = ?',
                        args: [credentials.email],
                    });

                    const user = result.rows[0];
                    if (!user) {
                        return null;
                    }

                    const passwordMatch = await bcrypt.compare(
                        credentials.password,
                        user.password_hash as string,
                    );

                    if (!passwordMatch) {
                        return null;
                    }

                    return {
                        id: user.id as string,
                        email: user.email as string,
                        username: user.username as string,
                    };
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    pages: {
        signIn: '/auth/signin',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.username = user.username;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
            }
            return session;
        },
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET || 'your-secret-key',
};

export const handler = NextAuth(authOptions);
