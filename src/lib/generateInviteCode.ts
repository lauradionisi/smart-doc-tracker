import { randomInt } from "crypto";

// Alfabeto senza caratteri ambigui: niente 0/O e 1/I/L
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * Genera un codice invito casuale tipo "K7M2-X9PQ":
 * 8 caratteri generati con crypto, con un trattino a metà per leggibilità.
 */
export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
