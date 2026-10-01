const euroFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

/**
 * "60.00" -> "60,00 €".
 * Intl accetta l'importo come stringa decimale e lo formatta in modo esatto,
 * senza convertirlo in number (niente errori di virgola mobile).
 */
export function formatEuro(amount: string): string {
  return euroFormatter.format(amount as Intl.StringNumericLiteral);
}
