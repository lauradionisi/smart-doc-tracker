import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentFamily } from "@/lib/auth";
import { parseCreateExpense } from "@/lib/expenseInput";
import {
  currentMonth,
  formatDateOnly,
  parseDateOnly,
  parseMonthRange,
  rangeLengthInDays,
  type DateRange,
} from "@/lib/dates";
import { expenseSelect, getExpenses, toExpenseJson } from "@/lib/expenses";

const MAX_RANGE_DAYS = 366; // basta per un anno bisestile

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

// ?from=YYYY-MM-DD&to=YYYY-MM-DD (to inclusa) oppure ?month=YYYY-MM.
// Senza parametri: mese corrente.
function parseRangeParams(params: URLSearchParams): { range: DateRange; month?: string } | { error: string } {
  const from = params.get("from");
  const to = params.get("to");
  const month = params.get("month");

  if (month !== null && (from !== null || to !== null)) {
    return { error: "Usa month oppure from/to, non entrambi" };
  }

  if (from !== null || to !== null) {
    if (from === null || to === null) {
      return { error: "from e to vanno indicati insieme" };
    }
    const fromDate = parseDateOnly(from);
    const toDate = parseDateOnly(to);
    if (!fromDate || !toDate) {
      return { error: "from e to devono avere il formato YYYY-MM-DD" };
    }
    if (fromDate > toDate) {
      return { error: "from non può essere successiva a to" };
    }
    const range = { from: fromDate, to: toDate };
    if (rangeLengthInDays(range) > MAX_RANGE_DAYS) {
      return { error: `L'intervallo può essere al massimo di ${MAX_RANGE_DAYS} giorni` };
    }
    return { range };
  }

  const monthValue = month ?? currentMonth();
  const range = parseMonthRange(monthValue);
  if (!range) {
    return { error: "Parametro month non valido: usa il formato YYYY-MM" };
  }
  return { range, month: monthValue };
}

export async function GET(request: Request) {
  try {
    const current = await getCurrentFamily();
    if (!current) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const parsed = parseRangeParams(new URL(request.url).searchParams);
    if ("error" in parsed) {
      return badRequest(parsed.error);
    }

    // Riepilogo calcolato sul server con Decimal
    const { expenses, summary } = await getExpenses(current.familyId, parsed.range);

    return NextResponse.json(
      {
        ...(parsed.month ? { month: parsed.month } : {}),
        from: formatDateOnly(parsed.range.from),
        to: formatDateOnly(parsed.range.to),
        summary,
        expenses,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore GET /api/expenses:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentFamily();
    if (!current) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    const { user, familyId } = current;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return badRequest("Body JSON non valido");
    }

    // Stesse regole del PATCH (src/lib/expenseInput.ts)
    const parsed = await parseCreateExpense(body, { familyId, userId: user.id });
    if (!parsed.ok) {
      return badRequest(parsed.error);
    }

    // Famiglia e autore vengono SOLO dalla sessione
    const expense = await prisma.expense.create({
      data: { ...parsed.value, familyId, createdById: user.id },
      select: expenseSelect,
    });

    return NextResponse.json({ expense: toExpenseJson(expense) }, { status: 201 });
  } catch (error) {
    console.error("Errore POST /api/expenses:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
