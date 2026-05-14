import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.string().optional(),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Default 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, rememberMe } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            currency: true,
            isActive: true,
            sessionVersion: true,
            profile: {
              select: {
                onboardingCompleted: true,
              },
            },
          },
        });

        if (!user || !user.isActive) return null;

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          currency: user.currency,
          sessionVersion: user.sessionVersion,
          onboardingCompleted: user.profile?.onboardingCompleted ?? false,
          rememberMe: rememberMe === "true",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
        token.currency = (user as { currency: string }).currency;
        token.sessionVersion = (user as { sessionVersion: number }).sessionVersion;
        token.onboardingCompleted = (user as { onboardingCompleted: boolean }).onboardingCompleted;
        if ((user as any).rememberMe === false) {
           token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 1 day
        }
      }

      delete (token as { image?: unknown }).image;
      delete token.picture;

      if (!user && token.id && typeof token.sessionVersion !== "number") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true },
        });

        if (dbUser) {
          token.sessionVersion = dbUser.sessionVersion;
        }
      }

      if (trigger === "update" && session) {
        token.onboardingCompleted = session.onboardingCompleted ?? token.onboardingCompleted;
        token.currency = session.currency ?? token.currency;
        token.name = session.name ?? token.name;
        token.sessionVersion = session.sessionVersion ?? token.sessionVersion;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.currency = token.currency as string;
        session.user.sessionVersion = token.sessionVersion as number;
        session.user.onboardingCompleted = token.onboardingCompleted as boolean;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      try {
        const target = url.startsWith("/") ? new URL(url, baseUrl) : new URL(url);
        const base = new URL(baseUrl);

        if (target.origin !== base.origin) return baseUrl;

        const callbackUrl = target.searchParams.get("callbackUrl");
        if (callbackUrl) {
          const normalized = callbackUrl.startsWith("/")
            ? callbackUrl
            : new URL(callbackUrl).pathname;
          target.search = "";
          target.pathname = normalized.startsWith("/") ? normalized : "/app";
        }

        return target.toString();
      } catch {
        return `${baseUrl}/app`;
      }
    },
  },
});
