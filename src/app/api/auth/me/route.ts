import { NextResponse } from "next/server";
import { getCurrentUser, getUserFamilies } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const families = await getUserFamilies(user.id);
    return NextResponse.json({ user, families }, { status: 200 });
  } catch (error) {
    console.error("Errore /api/auth/me:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
