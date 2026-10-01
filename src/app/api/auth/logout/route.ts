import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ message: "Logout effettuato" }, { status: 200 });
  } catch (error) {
    console.error("Errore logout:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
