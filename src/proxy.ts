import { NextResponse, type NextRequest } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

// Controllo veloce, solo sulla presenza del cookie.
// La verifica vera della sessione (DB) avviene nel layout di (app).
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("session");
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!hasSession && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Escludiamo API (rispondono già 401), file interni di Next e file statici
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
