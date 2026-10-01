import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { parseAmount } from "@/lib/money";
import { parseDateOnly } from "@/lib/dates";

// Validazione dei campi di una spesa, condivisa da POST (creazione) e PATCH (modifica)

const MAX_DESCRIPTION_LENGTH = 500;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const ok = <T>(value: T): Result<T> => ({ ok: true, value });
const fail = (error: string): { ok: false; error: string } => ({ ok: false, error });

/** Campi di una spesa già validati, pronti per Prisma */
export type ExpenseFields = {
  amount: Prisma.Decimal;
  expenseDate: Date;
  categoryId: string;
  description: string | null;
  isPersonal: boolean;
  userId: string; // chi ha pagato
};

/** Chi fa la richiesta: famiglia e utente vengono sempre dalla sessione */
type ExpenseContext = { familyId: string; userId: string };

// I campi che il client può inviare (familyId e createdBy non ci sono mai)
const BODY_FIELDS = ["amount", "expenseDate", "categoryId", "description", "isPersonal", "paidByUserId"] as const;
type ExpenseBody = Partial<Record<(typeof BODY_FIELDS)[number], unknown>>;

// --- Validatori dei singoli campi (senza database)

export function validateAmount(value: unknown): Result<Prisma.Decimal> {
  const amount = parseAmount(value);
  return amount
    ? ok(amount)
    : fail("Importo non valido: deve essere maggiore di 0 con al massimo 2 decimali");
}

export function validateExpenseDate(value: unknown): Result<Date> {
  const date = parseDateOnly(value);
  return date ? ok(date) : fail("Data non valida: usa il formato YYYY-MM-DD");
}

/** null, stringa vuota o solo spazi -> null (descrizione assente o cancellata) */
export function validateDescription(value: unknown): Result<string | null> {
  if (value === undefined || value === null) return ok(null);
  if (typeof value !== "string") return fail("description deve essere un testo");

  const description = value.trim() || null;
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return fail(`description può avere al massimo ${MAX_DESCRIPTION_LENGTH} caratteri`);
  }
  return ok(description);
}

export function validateIsPersonal(value: unknown): Result<boolean> {
  return typeof value === "boolean" ? ok(value) : fail("isPersonal deve essere true o false");
}

function validateId(value: unknown, error: string): Result<string> {
  return typeof value === "string" && value.trim() ? ok(value.trim()) : fail(error);
}

// --- Controlli sul database

/** Categoria predefinita oppure della famiglia dell'utente */
async function checkCategory(categoryId: string, familyId: string): Promise<Result<string>> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, OR: [{ familyId: null, isDefault: true }, { familyId }] },
    select: { id: true },
  });
  return category ? ok(category.id) : fail("Categoria non valida");
}

/** Chi ha pagato deve essere membro della STESSA famiglia */
async function checkFamilyMember(userId: string, familyId: string): Promise<Result<string>> {
  const member = await prisma.familyMember.findUnique({
    where: { familyId_userId: { familyId, userId } },
    select: { userId: true },
  });
  return member ? ok(member.userId) : fail("paidByUserId deve essere un membro della tua famiglia");
}

// --- Punto d'ingresso: prima i controlli sui valori, poi quelli sul database

async function parseFields(
  body: ExpenseBody,
  context: ExpenseContext,
  mode: "create" | "update"
): Promise<Result<Partial<ExpenseFields>>> {
  const isCreate = mode === "create";
  const has = (key: keyof ExpenseBody) => body[key] !== undefined;

  if (!isCreate && !BODY_FIELDS.some(has)) {
    return fail("Nessun campo da modificare");
  }

  const fields: Partial<ExpenseFields> = {};

  // Obbligatori in creazione, facoltativi in modifica
  if (isCreate || has("amount")) {
    const result = validateAmount(body.amount);
    if (!result.ok) return result;
    fields.amount = result.value;
  }

  if (isCreate || has("expenseDate")) {
    const result = validateExpenseDate(body.expenseDate);
    if (!result.ok) return result;
    fields.expenseDate = result.value;
  }

  if (isCreate || has("categoryId")) {
    const result = validateId(body.categoryId, "categoryId obbligatorio");
    if (!result.ok) return result;
    fields.categoryId = result.value;
  }

  // In creazione assente = null; in modifica null o "" cancellano la descrizione
  if (isCreate || has("description")) {
    const result = validateDescription(body.description);
    if (!result.ok) return result;
    fields.description = result.value;
  }

  // Valori predefiniti solo in creazione: Personale, pagata dall'utente loggato
  if (isCreate || has("isPersonal")) {
    const result = validateIsPersonal(isCreate ? (body.isPersonal ?? true) : body.isPersonal);
    if (!result.ok) return result;
    fields.isPersonal = result.value;
  }

  if (isCreate || has("paidByUserId")) {
    const result = validateId(
      isCreate ? (body.paidByUserId ?? context.userId) : body.paidByUserId,
      "paidByUserId non valido"
    );
    if (!result.ok) return result;
    fields.userId = result.value;
  }

  // Controlli sul database solo per i campi presenti
  if (fields.categoryId !== undefined) {
    const result = await checkCategory(fields.categoryId, context.familyId);
    if (!result.ok) return result;
  }

  if (fields.userId !== undefined) {
    const result = await checkFamilyMember(fields.userId, context.familyId);
    if (!result.ok) return result;
  }

  return ok(fields);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** POST: tutti i campi obbligatori validati, con i valori predefiniti */
export async function parseCreateExpense(body: unknown, context: ExpenseContext): Promise<Result<ExpenseFields>> {
  if (!isPlainObject(body)) return fail("Body JSON non valido");
  const result = await parseFields(body, context, "create");
  // In creazione parseFields imposta tutti i campi
  return result.ok ? ok(result.value as ExpenseFields) : result;
}

/** PATCH: solo i campi presenti, validati con le stesse regole */
export async function parseUpdateExpense(
  body: unknown,
  context: ExpenseContext
): Promise<Result<Partial<ExpenseFields>>> {
  if (!isPlainObject(body)) return fail("Body JSON non valido");
  return parseFields(body, context, "update");
}
