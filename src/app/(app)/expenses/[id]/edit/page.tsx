import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import ExpenseForm from "@/components/expenses/ExpenseForm"
import { getCurrentFamily } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { APP_TIME_ZONE, formatDateOnly } from "@/lib/dates"
import { formatAmount } from "@/lib/money"
import { getExpenseFormOptions } from "@/lib/expenses"
import { returnHrefFromParams } from "@/lib/periods"

export const metadata = {
  title: "Modifica spesa | Smart Doc Tracker",
}

type Params = Promise<{ id: string }>
type SearchParams = Promise<Record<string, string | string[] | undefined>>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

// createdAt è un orario (non solo un giorno): lo mostriamo nel fuso italiano
const createdAtFormatter = new Intl.DateTimeFormat("it-IT", {
  timeZone: APP_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
})

export default async function EditExpensePage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const current = await getCurrentFamily()
  if (!current) {
    redirect("/api/auth/session-expired")
  }
  const { user, familyId } = current

  const [{ id }, query] = await Promise.all([params, searchParams])
  const returnHref = returnHrefFromParams(first(query.period), first(query.date))

  // Filtro sulla famiglia: una spesa di un'altra famiglia "non esiste"
  const [expense, { categories, members }] = await Promise.all([
    prisma.expense.findFirst({
      where: { id, familyId },
      select: {
        id: true,
        amount: true,
        expenseDate: true,
        categoryId: true,
        description: true,
        isPersonal: true,
        userId: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
    getExpenseFormOptions(familyId, user.id),
  ])

  if (!expense) {
    notFound()
  }

  const createdByName = expense.createdBy.name ?? expense.createdBy.email

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={returnHref}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Spese
        </Link>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">Modifica spesa</h1>
        <p className="mt-2 text-muted-foreground">
          Registrata da {createdByName} il{" "}
          <time dateTime={expense.createdAt.toISOString()}>{createdAtFormatter.format(expense.createdAt)}</time>
        </p>
      </div>

      <ExpenseForm
        mode="edit"
        expenseId={expense.id}
        initialValues={{
          amount: formatAmount(expense.amount),
          expenseDate: formatDateOnly(expense.expenseDate),
          categoryId: expense.categoryId,
          description: expense.description,
          isPersonal: expense.isPersonal,
          paidByUserId: expense.userId,
        }}
        categories={categories}
        members={members}
        currentUserId={user.id}
        returnHref={returnHref}
      />
    </div>
  )
}
