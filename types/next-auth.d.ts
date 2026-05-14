import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      currency: string;
      onboardingCompleted: boolean;
      sessionVersion: number;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    currency: string;
    onboardingCompleted: boolean;
    sessionVersion: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    currency: string;
    onboardingCompleted: boolean;
    sessionVersion: number;
  }
}
