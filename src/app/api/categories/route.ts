import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentFamily } from "@/lib/auth";

export async function GET() {
  try {
    const current = await getCurrentFamily();
    if (!current) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    // Predefinite (di tutti) + quelle create dalla famiglia dell'utente
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ familyId: null, isDefault: true }, { familyId: current.familyId }],
      },
      select: { id: true, name: true, icon: true, color: true, isDefault: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Errore GET /api/categories:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
