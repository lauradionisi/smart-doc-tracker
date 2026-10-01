import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import ExpenseForm from "@/components/expenses/ExpenseForm"
import { getCurrentFamily } from "@/lib/auth"
import { todayDateOnly } from "@/lib/dates"
import { getExpenseFormOptions } from "@/lib/expenses"
import { returnHrefFromParams } from "@/lib/periods"

export const metadata = {
  title: "Nuova spesa | Smart Doc Tracker",
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

export default async function NewExpensePage({ searchParams }: { searchParams: SearchParams }) {
  const current = await getCurrentFamily()
  if (!current) {
    redirect("/api/auth/session-expired")
  }
  const { user, familyId } = current

  // Ritorno alla stessa vista da cui si è partiti (URL validato)
  const params = await searchParams
  const returnHref = returnHrefFromParams(first(params.period), first(params.date))

  const { categories, members } = await getExpenseFormOptions(familyId, user.id)

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
        <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-foreground">Nuova spesa</h1>
      </div>

      <ExpenseForm
        mode="create"
        categories={categories}
        members={members}
        currentUserId={user.id}
        defaultDate={todayDateOnly()}
        returnHref={returnHref}
      />
    </div>
  )
}
