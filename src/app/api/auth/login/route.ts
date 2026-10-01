import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, getUserFamilies } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_CREDENTIALS = "Email o password non corretti";

// Hash fittizio: se l'email non esiste facciamo comunque un confronto bcrypt,
// così i tempi di risposta non rivelano quali email sono registrate
const DUMMY_HASH = "$2b$10$xj/PH.OpOcYfDvv3NX3VCu4Vs21xArtM0u9mVt6Yed1IH64t1BC9i";

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const { email, password } = body;

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return NextResponse.json(
      { error: "Campi obbligatori: email, password" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, name: true, createdAt: true, passwordHash: true },
    });

    const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordOk) {
      return NextResponse.json({ error: INVALID_CREDENTIALS }, { status: 401 });
    }

    await createSession(user.id);

    // Escludiamo passwordHash dalla risposta
    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
    };
    const families = await getUserFamilies(user.id);

    return NextResponse.json({ user: publicUser, families }, { status: 200 });
  } catch (error) {
    console.error("Errore login:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
