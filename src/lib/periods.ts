import type { ExpenseGroupBy } from "@/lib/expenses";
import { addDays, formatDateOnly, parseDateOnly, todayDateOnly, type DateRange } from "@/lib/dates";

export type Period = "day" | "week" | "month" | "year";

export const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Giorno" },
  { value: "week", label: "Settimana" },
  { value: "month", label: "Mese" },
  { value: "year", label: "Anno" },
];

const DEFAULT_PERIOD: Period = "month";

export type PeriodView = DateRange & {
  period: Period;
  date: string; // data di riferimento "YYYY-MM-DD"
  label: string;
  prevDate: string;
  nextDate: string;
  groupBy: ExpenseGroupBy;
};

// Le date sono giorni di calendario a mezzanotte UTC: si formattano in UTC
const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", ...options });

const dayFormatter = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDayMonthFormatter = fmt({ day: "numeric", month: "short" });
const shortDateFormatter = fmt({ day: "numeric", month: "short", year: "numeric" });
const monthFormatter = fmt({ month: "long", year: "numeric" });
const monthNameFormatter = fmt({ month: "long" });
const groupDayFormatter = fmt({ weekday: "long", day: "numeric", month: "long" });
const groupDayWithYearFormatter = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" });

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// "5–11 ott 2026", "28 set – 4 ott 2026", "29 dic 2025 – 4 gen 2026"
function weekLabel(from: Date, to: Date): string {
  const end = shortDateFormatter.format(to);
  if (from.getUTCFullYear() !== to.getUTCFullYear()) {
    return `${shortDateFormatter.format(from)} – ${end}`;
  }
  if (from.getUTCMonth() !== to.getUTCMonth()) {
    return `${shortDayMonthFormatter.format(from)} – ${end}`;
  }
  return `${from.getUTCDate()}–${end}`;
}

function isPeriod(value: unknown): value is Period {
  return PERIOD_OPTIONS.some((option) => option.value === value);
}

/** Valori dell'URL -> periodo valido (con fallback: oggi e mese) */
export function resolvePeriod(periodParam?: string, dateParam?: string): PeriodView {
  const period = isPeriod(periodParam) ? periodParam : DEFAULT_PERIOD;
  const anchor = parseDateOnly(dateParam) ?? parseDateOnly(todayDateOnly())!;

  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const base = { period, date: formatDateOnly(anchor) };

  switch (period) {
    case "day":
      return {
        ...base,
        from: anchor,
        to: anchor,
        label: capitalize(dayFormatter.format(anchor)),
        prevDate: formatDateOnly(addDays(anchor, -1)),
        nextDate: formatDateOnly(addDays(anchor, 1)),
        groupBy: "day",
      };

    case "week": {
      // getUTCDay: 0 = domenica. La settimana inizia di lunedì.
      const daysSinceMonday = (anchor.getUTCDay() + 6) % 7;
      const from = addDays(anchor, -daysSinceMonday);
      const to = addDays(from, 6);
      return {
        ...base,
        from,
        to,
        label: weekLabel(from, to),
        prevDate: formatDateOnly(addDays(from, -7)),
        nextDate: formatDateOnly(addDays(from, 7)),
        groupBy: "day",
      };
    }

    case "month":
      return {
        ...base,
        from: new Date(Date.UTC(year, month, 1)),
        to: new Date(Date.UTC(year, month + 1, 0)),
        label: capitalize(monthFormatter.format(anchor)),
        prevDate: formatDateOnly(new Date(Date.UTC(year, month - 1, 1))),
        nextDate: formatDateOnly(new Date(Date.UTC(year, month + 1, 1))),
        groupBy: "day",
      };

    case "year":
      return {
        ...base,
        from: new Date(Date.UTC(year, 0, 1)),
        to: new Date(Date.UTC(year, 11, 31)),
        label: String(year),
        prevDate: formatDateOnly(new Date(Date.UTC(year - 1, 0, 1))),
        nextDate: formatDateOnly(new Date(Date.UTC(year + 1, 0, 1))),
        groupBy: "month",
      };
  }
}

/** URL della pagina spese per un periodo e una data */
export function expensesHref(period: Period, date: string): string {
  return `/expenses?${new URLSearchParams({ period, date })}`;
}

/** URL di una pagina delle spese (nuova, modifica) che ricorda la vista di partenza */
export function withReturnView(path: string, view: { period: Period; date: string }): string {
  return `${path}?${new URLSearchParams({ period: view.period, date: view.date })}`;
}

/**
 * URL per tornare alla lista dopo il salvataggio, dai parametri ?period=&date=.
 * Viene ricostruito da valori validati, quindi non può puntare a indirizzi arbitrari.
 * Senza un periodo valido: /expenses (mese corrente).
 */
export function returnHrefFromParams(periodParam?: string, dateParam?: string): string {
  if (!isPeriod(periodParam)) return "/expenses";
  const view = resolvePeriod(periodParam, dateParam);
  return expensesHref(view.period, view.date);
}

/** Etichetta di un gruppo: "Oggi", "Ieri", "lunedì 28 settembre" oppure "Ottobre" */
export function groupLabel(key: string, groupBy: ExpenseGroupBy): string {
  if (groupBy === "month") {
    return capitalize(monthNameFormatter.format(parseDateOnly(`${key}-01`)!));
  }

  const today = todayDateOnly();
  if (key === today) return "Oggi";
  if (key === formatDateOnly(addDays(parseDateOnly(today)!, -1))) return "Ieri";

  const date = parseDateOnly(key)!;
  const sameYear = key.slice(0, 4) === today.slice(0, 4);
  return (sameYear ? groupDayFormatter : groupDayWithYearFormatter).format(date);
}
