// Sunucu tarafı session yardımcıları

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, role: true, sessionVersion: true },
  });

  if (!user?.isActive) return null;
  if (user.sessionVersion !== session.user.sessionVersion) return null;

  return {
    ...session,
    user: {
      ...session.user,
      role: user.role,
      sessionVersion: user.sessionVersion,
    },
  };
}

export async function getRequiredAdminSession() {
  const session = await getRequiredSession();
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}
