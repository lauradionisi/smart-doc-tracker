import { randomInt } from "crypto";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Genera un codice invito tipo "BIA-A3F9":
 * 3 lettere dal nome della famiglia + 4 caratteri casuali.
 */
export function generateInviteCode(familyName: string): string {
  const prefix = familyName
    .normalize("NFD")
    .replace(/[^a-zA-Z]/g, "") // rimuove accenti, spazi, numeri e simboli
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");

  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += CHARS[randomInt(CHARS.length)];
  }

  return `${prefix}-${suffix}`;
}
