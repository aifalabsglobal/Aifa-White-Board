import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

const defaultWorkspaceName = (email?: string | null) => {
    if (!email) return 'My Workspace';
    const [username] = email.split('@');
    return `${username}'s Workspace`;
};

export const {
    handlers: authHandlers,
    signIn,
    signOut,
    auth,
} = (NextAuth as any)({
    adapter: PrismaAdapter(prisma),
    secret: process.env.AUTH_SECRET,
    session: {
        strategy: 'jwt',
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
            allowDangerousEmailAccountLinking: true,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email and password required');
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.password) {
                    throw new Error('Invalid credentials');
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValid) {
                    throw new Error('Invalid credentials');
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    // Don't include image - it causes HTTP 431
                };
            },
        }),
    ],
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }: { token: any; user: any }) {
            if (user) {
                token.id = user.id;
                // DO NOT store image in JWT - causes HTTP 431 error
                token.name = user.name;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user && token) {
                session.user.id = token.id || token.sub;
                // Image is fetched separately via API, not in session
                session.user.name = token.name;
                session.user.email = token.email;
            }
            return session;
        },
    },
    events: {
        async createUser({ user }: { user: any }) {
            const workspace = await (prisma as any).workspace.create({
                data: {
                    name: defaultWorkspaceName(user.email),
                    slug: `workspace-${user.id.slice(0, 8)}`,
                    ownerId: user.id,
                    members: {
                        create: {
                            userId: user.id,
                            role: 'OWNER',
                        },
                    },
                },
            });

            await (prisma as any).board.create({
                data: {
                    title: 'Welcome Board',
                    userId: user.id,
                    workspaceId: workspace.id,
                    content: {},
                },
            });
        },
    },
});
