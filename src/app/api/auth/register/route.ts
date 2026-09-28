import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/generateInviteCode";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_INVITE_CODE_ATTEMPTS = 5;

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  familyName?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function generateUniqueInviteCode(familyName: string): Promise<string> {
  for (let i = 0; i < MAX_INVITE_CODE_ATTEMPTS; i++) {
    const code = generateInviteCode(familyName);
    const existing = await prisma.family.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  throw new Error("Impossibile generare un codice invito univoco");
}

export async function POST(request: Request) {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
  }

  const { name, email, password, familyName } = body;

  // 1. Validazione
  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(password) ||
    !isNonEmptyString(familyName)
  ) {
    return NextResponse.json(
      { error: "Campi obbligatori: name, email, password, familyName" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json({ error: "Email non valida" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: "La password deve avere almeno 6 caratteri" },
      { status: 400 }
    );
  }

  try {
    // 2. Email già registrata?
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
    }

    // 3. Hash della password
    const passwordHash = await bcrypt.hash(password, 10);
    const inviteCode = await generateUniqueInviteCode(familyName);

    // 4. User + Family + FamilyMember: tutto o niente
    const { user, family } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
        },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      const family = await tx.family.create({
        data: {
          name: familyName.trim(),
          inviteCode,
          createdBy: user.id,
        },
        select: { id: true, name: true, inviteCode: true },
      });

      await tx.familyMember.create({
        data: { familyId: family.id, userId: user.id },
      });

      return { user, family };
    });

    // 5. Risposta senza password
    return NextResponse.json({ user, family }, { status: 201 });
  } catch (error) {
    // Registrazione concorrente con la stessa email
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
    }

    console.error("Errore registrazione:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
