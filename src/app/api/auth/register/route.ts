import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/generateInviteCode";
import { createSession } from "@/lib/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_INVITE_CODE_ATTEMPTS = 5;

type RegisterBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  familyName?: unknown;
  inviteCode?: unknown;
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

  const { name, email, password, familyName, inviteCode } = body;

  // 1. Validazione
  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(email) ||
    !isNonEmptyString(password)
  ) {
    return NextResponse.json(
      { error: "Campi obbligatori: name, email, password" },
      { status: 400 }
    );
  }

  // Esattamente uno tra familyName (nuova famiglia) e inviteCode (famiglia esistente)
  const hasFamilyName = isNonEmptyString(familyName);
  const hasInviteCode = isNonEmptyString(inviteCode);
  if (hasFamilyName === hasInviteCode) {
    return NextResponse.json(
      {
        error:
          "Indica familyName per creare una nuova famiglia oppure inviteCode per unirti a una famiglia esistente (non entrambi)",
      },
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

    // 3. Con inviteCode: verifichiamo la famiglia PRIMA di creare l'utente
    let existingFamily: { id: string; name: string; inviteCode: string } | null = null;
    if (hasInviteCode) {
      existingFamily = await prisma.family.findUnique({
        where: { inviteCode: inviteCode.trim().toUpperCase() },
        select: { id: true, name: true, inviteCode: true },
      });
      if (!existingFamily) {
        return NextResponse.json({ error: "Codice invito non valido" }, { status: 404 });
      }
    }

    // 4. Hash della password
    const passwordHash = await bcrypt.hash(password, 10);
    const newFamilyData = hasFamilyName
      ? { name: familyName.trim(), inviteCode: await generateUniqueInviteCode(familyName) }
      : null;

    // 5. User + (Family) + FamilyMember: tutto o niente
    const { user, family } = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
        },
        select: { id: true, name: true, email: true, createdAt: true },
      });

      // Nuova famiglia (familyName) oppure famiglia esistente (inviteCode)
      const family = newFamilyData
        ? await tx.family.create({
            data: { ...newFamilyData, createdBy: user.id },
            select: { id: true, name: true, inviteCode: true },
          })
        : existingFamily;

      if (!family) {
        // Non dovrebbe mai succedere: la validazione garantisce uno dei due casi
        throw new Error("Nessuna famiglia da associare all'utente");
      }

      await tx.familyMember.create({
        data: { familyId: family.id, userId: user.id },
      });

      return { user, family };
    });

    // 6. Login automatico dopo la registrazione
    await createSession(user.id);

    // 7. Risposta senza password
    return NextResponse.json({ user, family }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Registrazione concorrente con la stessa email
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Email già registrata" }, { status: 409 });
      }
      // Famiglia cancellata tra il controllo e la transaction (annullata, nessun utente creato)
      if (error.code === "P2003") {
        return NextResponse.json({ error: "Codice invito non valido" }, { status: 404 });
      }
    }

    console.error("Errore registrazione:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
