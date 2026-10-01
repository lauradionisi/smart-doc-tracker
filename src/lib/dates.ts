// Le date "solo giorno" (colonne @db.Date) sono rappresentate come Date
// a mezzanotte UTC: così il giorno di calendario non dipende dal fuso del server.

const DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_REGEX = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export const APP_TIME_ZONE = "Europe/Rome";

/** Intervallo di giorni, estremi inclusi */
export type DateRange = { from: Date; to: Date };

/**
 * "YYYY-MM-DD" -> Date a mezzanotte UTC.
 * Restituisce null per formati errati o date inesistenti come "2026-02-30".
 */
export function parseDateOnly(value: unknown): Date | null {
  if (typeof value !== "string") return null;

  const match = DATE_REGEX.exec(value.trim());
  if (!match) return null;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));

  // Date.UTC "sposta" le date inesistenti (30 febbraio -> 2 marzo): le scartiamo
  const isSameDate =
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;

  return isSameDate ? date : null;
}

/** Date a mezzanotte UTC -> "YYYY-MM-DD" */
export function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Aggiunge (o toglie) giorni a una data "solo giorno" */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Numero di giorni dell'intervallo, estremi inclusi */
export function rangeLengthInDays(range: DateRange): number {
  return Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS) + 1;
}

/** "YYYY-MM" -> dal primo all'ultimo giorno del mese (inclusi) */
export function parseMonthRange(value: string): DateRange | null {
  const match = MONTH_REGEX.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  return {
    from: new Date(Date.UTC(year, month - 1, 1)),
    // Il giorno 0 del mese successivo è l'ultimo giorno di questo mese
    to: new Date(Date.UTC(year, month, 0)),
  };
}

function datePartsInTimeZone(timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Oggi "YYYY-MM-DD" nel fuso italiano (non in quello del server) */
export function todayDateOnly(timeZone = APP_TIME_ZONE): string {
  const { year, month, day } = datePartsInTimeZone(timeZone);
  return `${year}-${month}-${day}`;
}

/** Mese corrente "YYYY-MM" nel fuso italiano (non in quello del server) */
export function currentMonth(timeZone = APP_TIME_ZONE): string {
  const { year, month } = datePartsInTimeZone(timeZone);
  return `${year}-${month}`;
}
