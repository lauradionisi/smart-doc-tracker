import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 giorni

// Campi dell'utente sicuri da restituire al client (mai passwordHash)
export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} as const;

// Nel DB salviamo solo l'hash: chi legge la tabella non può usare i token
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: { id: hashToken(token), userId, expiresAt },
  });

  // In Next.js 16 cookies() è asincrono
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: publicUserSelect } },
  });
  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    // Il cookie non si può cancellare qui: getCurrentUser può essere chiamata
    // anche da Server Components, dove i cookie sono in sola lettura
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { id: hashToken(token) } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

// Utente loggato + la sua famiglia (una persona appartiene a una sola famiglia).
// La famiglia si ricava sempre dalla sessione, mai dal body della richiesta.
export async function getCurrentFamily() {
  const user = await getCurrentUser();
  if (!user) return null;

  const membership = await prisma.familyMember.findFirst({
    where: { userId: user.id },
    select: { familyId: true },
  });
  if (!membership) return null;

  return { user, familyId: membership.familyId };
}

export async function getUserFamilies(userId: string) {
  const memberships = await prisma.familyMember.findMany({
    where: { userId },
    select: {
      joinedAt: true,
      family: { select: { id: true, name: true, inviteCode: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return memberships.map(({ family, joinedAt }) => ({ ...family, joinedAt }));
}
