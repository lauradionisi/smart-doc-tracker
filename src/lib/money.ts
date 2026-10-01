import { Prisma } from "@/generated/prisma/client";

// Fino a 8 cifre intere e 2 decimali: il massimo di una colonna Decimal(10, 2)
const AMOUNT_REGEX = /^\d{1,8}(\.\d{1,2})?$/;

/**
 * Converte l'importo ricevuto in un Decimal esatto (mai number per i calcoli).
 * Accetta "60.5" oppure 60.5. Restituisce null se non è > 0 con al massimo 2 decimali.
 */
export function parseAmount(value: unknown): Prisma.Decimal | null {
  let text: string;
  if (typeof value === "string") {
    text = value.trim();
  } else if (typeof value === "number" && Number.isFinite(value)) {
    text = String(value);
  } else {
    return null;
  }

  if (!AMOUNT_REGEX.test(text)) return null;

  const amount = new Prisma.Decimal(text);
  return amount.greaterThan(0) ? amount : null;
}

/** Importo per il JSON: sempre stringa con 2 decimali, es. "60.00" */
export function formatAmount(amount: Prisma.Decimal): string {
  return amount.toFixed(2);
}
