import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

// Usata dal layout protetto quando la sessione non è valida:
// rimuove il cookie (evitando il loop di redirect con il proxy) e porta al login
export async function GET(request: Request) {
  try {
    await deleteSession();
  } catch (error) {
    console.error("Errore session-expired:", error);
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  // Rimuove il cookie anche se la cancellazione nel DB è fallita
  response.cookies.delete("session");
  return response;
}
