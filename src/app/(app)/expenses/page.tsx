import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, ChevronRight, Plus, ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import DeleteExpenseButton from "@/components/expenses/DeleteExpenseButton"
import { getCurrentFamily } from "@/lib/auth"
import { getExpenses, type ExpenseJson } from "@/lib/expenses"
import { expensesHref, groupLabel, PERIOD_OPTIONS, resolvePeriod, withReturnView } from "@/lib/periods"
import { formatEuro } from "@/lib/format"

export const metadata = {
  title: "Spese | Smart Doc Tracker",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const shortDayFormatter = new Intl.DateTimeFormat("it-IT", { timeZone: "UTC", day: "numeric", month: "short" })

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  // Layout e pagina vengono renderizzati in parallelo: la pagina verifica da sola
  const current = await getCurrentFamily()
  if (!current) {
    redirect("/api/auth/session-expired")
  }

  const params = await searchParams
  const view = resolvePeriod(first(params.period), first(params.date))
  const { summary, groups } = await getExpenses(current.familyId, view, view.groupBy)

  const newExpenseHref = withReturnView("/expenses/new", view)

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Titolo + azione principale */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Spese</h1>
          <p className="text-muted-foreground mt-1">Le spese della tua famiglia</p>
        </div>
        <Button asChild className="gap-2 rounded-full shadow-soft">
          <Link href={newExpenseHref}>
            <Plus className="h-4 w-4" />
            Aggiungi spesa
          </Link>
        </Button>
      </div>

      {/* Selettore del periodo */}
      <div className="glass-card rounded-3xl shadow-soft p-3 md:p-4 space-y-3">
        <nav aria-label="Tipo di periodo">
          <ul className="grid grid-cols-4 gap-1 rounded-full bg-muted/60 p-1">
            {PERIOD_OPTIONS.map((option) => {
              const active = option.value === view.period
              return (
                <li key={option.value}>
                  <Link
                    href={expensesHref(option.value, view.date)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-full px-2 py-2 text-center text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-2">
          <Button asChild variant="outline" size="icon" className="rounded-full btn-icon-readable shrink-0">
            <Link href={expensesHref(view.period, view.prevDate)} aria-label="Periodo precedente">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h2 className="text-center text-lg font-semibold text-foreground">{view.label}</h2>
          <Button asChild variant="outline" size="icon" className="rounded-full btn-icon-readable shrink-0">
            <Link href={expensesHref(view.period, view.nextDate)} aria-label="Periodo successivo">
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Riepilogo (calcolato sul server) */}
      <section aria-label="Riepilogo del periodo" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-3xl shadow-soft p-6">
          <p className="text-sm font-medium text-muted-foreground">Totale</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-foreground tabular-nums">
            {formatEuro(summary.total)}
          </p>
        </div>

        <div className="glass-card rounded-3xl shadow-soft p-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Personale e familiare</p>
          <dl className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-foreground">Personale</dt>
              <dd className="font-semibold text-foreground tabular-nums">{formatEuro(summary.personal)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-foreground">Familiare</dt>
              <dd className="font-semibold text-foreground tabular-nums">{formatEuro(summary.family)}</dd>
            </div>
          </dl>
        </div>

        <div className="glass-card rounded-3xl shadow-soft p-6 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Categorie principali</p>
          {summary.topCategories.length > 0 ? (
            <ol className="space-y-2">
              {summary.topCategories.map((category) => (
                <li key={category.id} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-foreground">
                    <span aria-hidden="true">{category.icon ?? "📦"}</span>
                    <span className="truncate">{category.name}</span>
                  </span>
                  <span className="font-semibold text-foreground tabular-nums">{formatEuro(category.total)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground">—</p>
          )}
        </div>
      </section>

      {/* Lista raggruppata per giorno (o per mese nella vista Anno) */}
      {groups.length === 0 ? (
        <div className="glass-card rounded-3xl shadow-soft px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
            <ReceiptText className="h-7 w-7 text-foreground" aria-hidden="true" />
          </div>
          <p className="text-lg font-medium text-foreground">Nessuna spesa in questo periodo</p>
          <Button asChild className="mt-6 gap-2 rounded-full shadow-soft">
            <Link href={newExpenseHref}>
              <Plus className="h-4 w-4" />
              Aggiungi una spesa
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const headingId = `group-${group.key}`
            return (
              <section key={group.key} aria-labelledby={headingId} className="space-y-2">
                <div className="flex items-baseline justify-between gap-2 px-2">
                  <h3 id={headingId} className="font-semibold text-foreground">
                    {groupLabel(group.key, view.groupBy)}
                  </h3>
                  <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                    {formatEuro(group.total)}
                  </span>
                </div>

                <ul className="glass-card rounded-3xl shadow-soft divide-y divide-border/40 overflow-hidden">
                  {group.expenses.map((expense) => (
                    <ExpenseItem
                      key={expense.id}
                      expense={expense}
                      editHref={withReturnView(`/expenses/${encodeURIComponent(expense.id)}/edit`, view)}
                      showDate={view.groupBy === "month"}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}

      {/* Su mobile: pulsante tondo fisso in basso a destra */}
      <Link
        href={newExpenseHref}
        aria-label="Aggiungi spesa"
        className="md:hidden fixed bottom-6 right-6 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}

function ExpenseItem({
  expense,
  editHref,
  showDate,
}: {
  expense: ExpenseJson
  editHref: string
  showDate: boolean
}) {
  const title = expense.description ?? expense.category.name
  const amount = formatEuro(expense.amount)
  const payer = expense.paidBy.name ?? "Utente"

  return (
    // Tutta la riga apre la modifica; il cestino è un elemento separato (fuori dal link)
    <li className="flex flex-wrap items-center pr-2 transition-colors hover:bg-accent/40">
      <Link
        href={editHref}
        className="flex min-w-0 flex-1 basis-64 items-center gap-3 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
      >
        <span className="sr-only">Modifica: </span>
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-xl"
          // Colore della categoria con trasparenza (#rrggbb + 26 = ~15%)
          style={expense.category.color ? { backgroundColor: `${expense.category.color}26` } : undefined}
        >
          {expense.category.icon ?? "📦"}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-foreground">{title}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            {showDate && <span>{shortDayFormatter.format(new Date(expense.expenseDate))}</span>}
            {expense.description && <span>{expense.category.name}</span>}
            <span>Pagata da {payer}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                expense.isPersonal ? "bg-muted text-muted-foreground" : "bg-primary/20 text-foreground"
              }`}
            >
              {expense.isPersonal ? "Personale" : "Familiare"}
            </span>
          </span>
        </span>

        <span className="shrink-0 font-semibold text-foreground tabular-nums">{amount}</span>
      </Link>

      <div className="ml-auto shrink-0 py-1">
        <DeleteExpenseButton expenseId={expense.id} label={`${title}, ${amount}`} />
      </div>
    </li>
  )
}
