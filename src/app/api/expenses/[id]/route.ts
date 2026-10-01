import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentFamily } from "@/lib/auth";
import { parseUpdateExpense } from "@/lib/expenseInput";
import { expenseSelect, toExpenseJson } from "@/lib/expenses";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Spesa non trovata" }, { status: 404 });

// Qualsiasi membro della famiglia può modificare qualsiasi spesa della famiglia
export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const current = await getCurrentFamily();
    if (!current) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    const { user, familyId } = current;
    const { id } = await params;

    // Prima l'appartenenza alla famiglia: chi non ha accesso riceve sempre 404,
    // mai un 400 sul body che riveli che la spesa esiste
    const existing = await prisma.expense.findFirst({
      where: { id, familyId },
      select: { id: true },
    });
    if (!existing) {
      return notFound();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Body JSON non valido" }, { status: 400 });
    }

    // Stesse regole del POST, solo sui campi presenti
    const parsed = await parseUpdateExpense(body, { familyId, userId: user.id });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Solo i campi validati: familyId e createdBy non cambiano mai
    const expense = await prisma.expense.update({
      where: { id, familyId },
      data: parsed.value,
      select: expenseSelect,
    });

    return NextResponse.json({ expense: toExpenseJson(expense) }, { status: 200 });
  } catch (error) {
    // Cancellata da un altro membro tra il controllo e la modifica
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return notFound();
    }
    console.error("Errore PATCH /api/expenses/[id]:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const current = await getCurrentFamily();
    if (!current) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const { id } = await params;

    // Il filtro su familyId fa sì che si possano cancellare solo le spese della
    // propria famiglia. Spesa inesistente o di un'altra famiglia: stesso 404,
    // così non riveliamo che esiste.
    const { count } = await prisma.expense.deleteMany({
      where: { id, familyId: current.familyId },
    });

    if (count === 0) {
      return notFound();
    }

    return NextResponse.json({ message: "Spesa eliminata" }, { status: 200 });
  } catch (error) {
    console.error("Errore DELETE /api/expenses/[id]:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
