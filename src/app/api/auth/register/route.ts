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

type FamilySummary = { id: string; name: string; inviteCode: string };

type NewAccount = {
  name: string;
  email: string;
  passwordHash: string;
  newFamilyName: string | null; // crea una nuova famiglia
  existingFamily: FamilySummary | null; // si unisce a una famiglia esistente
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// User + (Family) + FamilyMember in un'unica transaction: tutto o niente.
// Se il codice invito generato esiste già (unique constraint) la transaction
// viene annullata da Postgres: la ripetiamo con un nuovo codice.
async function createAccount(account: NewAccount) {
  for (let attempt = 1; ; attempt++) {
    const progress = { creatingFamily: false };

    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: account.name,
            email: account.email,
            passwordHash: account.passwordHash,
          },
          select: { id: true, name: true, email: true, createdAt: true },
        });

        let family = account.existingFamily;
        if (account.newFamilyName) {
          progress.creatingFamily = true;
          family = await tx.family.create({
            data: {
              name: account.newFamilyName,
              inviteCode: generateInviteCode(),
              createdBy: user.id,
            },
            select: { id: true, name: true, inviteCode: true },
          });
          progress.creatingFamily = false;
        }

        if (!family) {
          // Non dovrebbe mai succedere: la validazione garantisce uno dei due casi
          throw new Error("Nessuna famiglia da associare all'utente");
        }

        await tx.familyMember.create({
          data: { familyId: family.id, userId: user.id },
        });

        return { user, family };
      });
    } catch (error) {
      // P2002 durante la creazione della famiglia = codice invito già usato
      if (progress.creatingFamily && isUniqueViolation(error)) {
        if (attempt < MAX_INVITE_CODE_ATTEMPTS) continue;
        throw new Error("Impossibile generare un codice invito univoco");
      }
      throw error;
    }
  }
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
    let existingFamily: FamilySummary | null = null;
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

    // 5. User + (Family) + FamilyMember: tutto o niente
    const { user, family } = await createAccount({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      newFamilyName: hasFamilyName ? familyName.trim() : null,
      existingFamily,
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
