import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/money";
import { formatDateOnly, type DateRange } from "@/lib/dates";

// Campi letti per ogni spesa (uguali per API e pagine)
export const expenseSelect = {
  id: true,
  amount: true,
  expenseDate: true,
  description: true,
  isPersonal: true,
  createdAt: true,
  category: { select: { id: true, name: true, icon: true, color: true } },
  paidBy: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseSelect;

type ExpenseRow = Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>;

// Importo come stringa ("60.00") e data come "YYYY-MM-DD"
export function toExpenseJson(expense: ExpenseRow) {
  return {
    ...expense,
    amount: formatAmount(expense.amount),
    expenseDate: formatDateOnly(expense.expenseDate),
    createdAt: expense.createdAt.toISOString(),
  };
}

export type ExpenseJson = ReturnType<typeof toExpenseJson>;

export type TopCategory = {
  id: string;
  name: string;
  icon: string | null;
  total: string;
};

export type ExpenseSummary = {
  total: string;
  personal: string;
  family: string;
  topCategories: TopCategory[];
};

export type ExpenseGroupBy = "day" | "month";

export type ExpenseGroup = {
  key: string; // "YYYY-MM-DD" (giorno) oppure "YYYY-MM" (mese)
  total: string;
  expenses: ExpenseJson[];
};

const ZERO = new Prisma.Decimal(0);

// Tutte le somme con Decimal: nessun importo passa mai da number
function summarize(rows: ExpenseRow[]): ExpenseSummary {
  let total = ZERO;
  let personal = ZERO;
  let family = ZERO;
  const byCategory = new Map<string, { category: ExpenseRow["category"]; total: Prisma.Decimal }>();

  for (const row of rows) {
    total = total.plus(row.amount);
    if (row.isPersonal) personal = personal.plus(row.amount);
    else family = family.plus(row.amount);

    const entry = byCategory.get(row.category.id);
    if (entry) entry.total = entry.total.plus(row.amount);
    else byCategory.set(row.category.id, { category: row.category, total: row.amount });
  }

  const topCategories = [...byCategory.values()]
    .sort((a, b) => b.total.comparedTo(a.total) || a.category.name.localeCompare(b.category.name, "it"))
    .slice(0, 3)
    .map(({ category, total }) => ({
      id: category.id,
      name: category.name,
      icon: category.icon,
      total: formatAmount(total),
    }));

  return {
    total: formatAmount(total),
    personal: formatAmount(personal),
    family: formatAmount(family),
    topCategories,
  };
}

// Raggruppa per giorno o per mese mantenendo l'ordine (date decrescenti)
function groupRows(rows: ExpenseRow[], groupBy: ExpenseGroupBy): ExpenseGroup[] {
  const groups: { key: string; total: Prisma.Decimal; expenses: ExpenseJson[] }[] = [];

  for (const row of rows) {
    const day = formatDateOnly(row.expenseDate);
    const key = groupBy === "day" ? day : day.slice(0, 7);

    let group = groups.at(-1);
    if (!group || group.key !== key) {
      group = { key, total: ZERO, expenses: [] };
      groups.push(group);
    }
    group.total = group.total.plus(row.amount);
    group.expenses.push(toExpenseJson(row));
  }

  return groups.map((g) => ({ ...g, total: formatAmount(g.total) }));
}

const OTHER_CATEGORY_ID = "default-altro";

/** Categorie e membri per il form di una spesa (nuova o in modifica) */
export async function getExpenseFormOptions(familyId: string, currentUserId: string) {
  const [categories, members] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ familyId: null, isDefault: true }, { familyId }] },
      select: { id: true, name: true, icon: true },
      orderBy: { name: "asc" },
    }),
    prisma.familyMember.findMany({
      where: { familyId },
      select: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    }),
  ]);

  // "Altro" in fondo alla griglia
  categories.sort((a, b) => Number(a.id === OTHER_CATEGORY_ID) - Number(b.id === OTHER_CATEGORY_ID));

  // L'utente loggato per primo, con "(tu)"
  const memberOptions = members
    .map(({ user }) => {
      const name = user.name ?? user.email;
      return { id: user.id, name: user.id === currentUserId ? `${name} (tu)` : name };
    })
    .sort((a, b) => Number(b.id === currentUserId) - Number(a.id === currentUserId));

  return { categories, members: memberOptions };
}

/** Spese della famiglia nell'intervallo (estremi inclusi), più recenti prima */
export async function getExpenses(
  familyId: string,
  range: DateRange,
  groupBy: ExpenseGroupBy = "day"
) {
  const rows = await prisma.expense.findMany({
    where: {
      familyId,
      expenseDate: { gte: range.from, lte: range.to },
    },
    select: expenseSelect,
    orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
  });

  return {
    expenses: rows.map(toExpenseJson),
    summary: summarize(rows),
    groups: groupRows(rows, groupBy),
  };
}
