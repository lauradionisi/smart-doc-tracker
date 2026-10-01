"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type CategoryOption = { id: string; name: string; icon: string | null }
type MemberOption = { id: string; name: string }

/** Valori di una spesa esistente, nel formato dell'API */
export type ExpenseInitialValues = {
  amount: string // "60.00"
  expenseDate: string // "YYYY-MM-DD"
  categoryId: string
  description: string | null
  isPersonal: boolean
  paidByUserId: string
}

type CommonProps = {
  categories: CategoryOption[]
  members: MemberOption[]
  currentUserId: string
  returnHref: string
}

// "create": nuova spesa. "edit": modifica di una spesa esistente.
type Props = CommonProps &
  (
    | { mode: "create"; defaultDate: string } // oggi "YYYY-MM-DD" nel fuso italiano
    | { mode: "edit"; expenseId: string; initialValues: ExpenseInitialValues }
  )

type SubmitAction = "back" | "another"

const AMOUNT_INPUT_REGEX = /^\d{1,8}([.,]\d{0,2})?$/

/**
 * "12,5" -> "12.50", "7" -> "7.00". Lavora solo sulla stringa:
 * l'importo non passa mai da number. Restituisce null se non valido o zero.
 */
export function normalizeAmount(input: string): string | null {
  const text = input.trim().replace(/\s+/g, "")
  if (!AMOUNT_INPUT_REGEX.test(text)) return null

  const [integerPart, decimalPart = ""] = text.split(/[.,]/)
  const integer = integerPart.replace(/^0+(?=\d)/, "") // "007" -> "7"
  const normalized = `${integer}.${decimalPart.padEnd(2, "0")}`

  return normalized === "0.00" ? null : normalized
}

const inputClassName =
  "h-11 rounded-xl border-border/50 bg-muted/30 text-foreground focus:border-primary/50"

// Aspetto dei pulsanti di scelta: il vero <input type="radio"> è nascosto (peer)
const choiceClassName =
  "flex items-center justify-center rounded-2xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm font-medium text-foreground transition-colors cursor-pointer hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/25 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50"

export default function ExpenseForm(props: Props) {
  const { categories, members, currentUserId, returnHref } = props
  const isEdit = props.mode === "edit"
  const initial = isEdit ? props.initialValues : null

  const router = useRouter()
  const amountRef = useRef<HTMLInputElement>(null)
  const categoryFieldsetRef = useRef<HTMLFieldSetElement>(null)

  // In modifica l'importo si mostra all'italiana: "60.00" -> "60,00"
  const [amount, setAmount] = useState(initial ? initial.amount.replace(".", ",") : "")
  const [date, setDate] = useState(initial ? initial.expenseDate : props.mode === "create" ? props.defaultDate : "")
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [isPersonal, setIsPersonal] = useState(initial?.isPersonal ?? true)
  const [paidByUserId, setPaidByUserId] = useState(initial?.paidByUserId ?? currentUserId)

  const [amountError, setAmountError] = useState<string | null>(null)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<SubmitAction | null>(null)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)

  // Con un solo membro "Personale/Familiare" e "chi ha pagato" non servono
  const hasMultipleMembers = members.length > 1

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Quale pulsante ha inviato il form (Invio in un campo = "Salva")
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
    const action: SubmitAction = submitter?.value === "another" ? "another" : "back"

    setError(null)
    setSavedMessage(null)

    // Validazione lato client
    const normalizedAmount = normalizeAmount(amount)
    const nextAmountError = normalizedAmount
      ? null
      : "Inserisci un importo maggiore di 0, con al massimo 2 decimali (es. 12,50)"
    const nextDateError = /^\d{4}-\d{2}-\d{2}$/.test(date) ? null : "Scegli una data"
    const nextCategoryError = categoryId ? null : "Scegli una categoria"

    setAmountError(nextAmountError)
    setDateError(nextDateError)
    setCategoryError(nextCategoryError)

    if (nextAmountError) {
      amountRef.current?.focus()
      return
    }
    if (nextDateError) {
      document.getElementById("expenseDate")?.focus()
      return
    }
    if (nextCategoryError) {
      categoryFieldsetRef.current?.querySelector<HTMLInputElement>("input")?.focus()
      return
    }

    const values = {
      amount: normalizedAmount,
      expenseDate: date,
      categoryId,
      description: description.trim() || null,
      isPersonal,
      paidByUserId,
    }

    let body: Record<string, unknown>
    if (initial) {
      // Modifica: SOLO i campi cambiati rispetto ai valori iniziali
      body = {}
      if (values.amount !== initial.amount) body.amount = values.amount
      if (values.expenseDate !== initial.expenseDate) body.expenseDate = values.expenseDate
      if (values.categoryId !== initial.categoryId) body.categoryId = values.categoryId
      // null cancella la descrizione
      if (values.description !== initial.description) body.description = values.description
      if (hasMultipleMembers) {
        if (values.isPersonal !== initial.isPersonal) body.isPersonal = values.isPersonal
        if (values.paidByUserId !== initial.paidByUserId) body.paidByUserId = values.paidByUserId
      }

      // Nessuna modifica: torniamo alla lista senza richieste
      if (Object.keys(body).length === 0) {
        setPending(action)
        router.push(returnHref)
        return
      }
    } else {
      body = { amount: values.amount, expenseDate: values.expenseDate, categoryId: values.categoryId }
      if (values.description) body.description = values.description
      if (hasMultipleMembers) {
        body.isPersonal = values.isPersonal
        body.paidByUserId = values.paidByUserId
      }
    }

    setPending(action)
    try {
      const res = await fetch(
        isEdit ? `/api/expenses/${encodeURIComponent(props.expenseId)}` : "/api/expenses",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Si è verificato un errore. Riprova.")
        setPending(null)
        return
      }

      if (action === "back") {
        // Il pulsante resta disattivato durante la navigazione
        router.push(returnHref)
        router.refresh()
        return
      }

      // "Salva e aggiungi un'altra": svuota importo, categoria e descrizione,
      // tiene data, chi ha pagato e Personale/Familiare
      setAmount("")
      setCategoryId("")
      setDescription("")
      setSavedMessage("Spesa salvata ✓ Puoi aggiungerne un'altra.")
      setPending(null)
      amountRef.current?.focus()
    } catch {
      setError("Impossibile contattare il server. Riprova.")
      setPending(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="glass-card rounded-3xl shadow-soft p-5 md:p-8 space-y-6">
      {/* Conferma dopo "Salva e aggiungi un'altra" */}
      <p aria-live="polite" className={savedMessage ? "rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700 dark:text-green-400" : "sr-only"}>
        {savedMessage}
      </p>

      {/* Importo + data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-foreground">
            Importo
          </label>
          <div className="relative">
            <Input
              ref={amountRef}
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              // In modifica niente tastiera aperta in automatico su mobile
              autoFocus={!isEdit}
              aria-invalid={amountError ? true : undefined}
              aria-describedby={amountError ? "amount-error" : undefined}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setAmountError(null)
                setSavedMessage(null)
              }}
              className={`${inputClassName} pr-10 text-lg font-semibold tabular-nums`}
            />
            <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              €
            </span>
          </div>
          {amountError && (
            <p id="amount-error" className="text-sm text-destructive">
              {amountError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="expenseDate" className="text-sm font-medium text-foreground">
            Data
          </label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            required
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? "date-error" : undefined}
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setDateError(null)
            }}
            // Icona del calendario leggibile anche in dark mode
            className={`${inputClassName} dark:[color-scheme:dark]`}
          />
          {dateError && (
            <p id="date-error" className="text-sm text-destructive">
              {dateError}
            </p>
          )}
        </div>
      </div>

      {/* Categoria: pulsanti con emoji, comodi da toccare */}
      <fieldset
        ref={categoryFieldsetRef}
        aria-describedby={categoryError ? "category-error" : undefined}
        className="space-y-2"
      >
        <legend className="mb-2 text-sm font-medium text-foreground">Categoria</legend>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {categories.map((category) => (
            <label key={category.id} className="block">
              <input
                type="radio"
                name="categoryId"
                value={category.id}
                checked={categoryId === category.id}
                onChange={() => {
                  setCategoryId(category.id)
                  setCategoryError(null)
                }}
                className="peer sr-only"
              />
              <span className={`${choiceClassName} h-full min-h-20 flex-col gap-1 px-2 text-center text-xs leading-tight`}>
                <span aria-hidden="true" className="text-2xl">
                  {category.icon ?? "📦"}
                </span>
                {category.name}
              </span>
            </label>
          ))}
        </div>
        {categoryError && (
          <p id="category-error" className="text-sm text-destructive">
            {categoryError}
          </p>
        )}
      </fieldset>

      {/* Descrizione */}
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          Descrizione <span className="font-normal text-muted-foreground">(facoltativa)</span>
        </label>
        <Input
          id="description"
          name="description"
          type="text"
          maxLength={500}
          autoComplete="off"
          placeholder="Es. Spesa settimanale"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClassName}
        />
      </div>

      {hasMultipleMembers && (
        <>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-foreground">Tipo di spesa</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: "Personale" },
                { value: false, label: "Familiare" },
              ].map((option) => (
                <label key={option.label} className="block">
                  <input
                    type="radio"
                    name="isPersonal"
                    value={String(option.value)}
                    checked={isPersonal === option.value}
                    onChange={() => setIsPersonal(option.value)}
                    className="peer sr-only"
                  />
                  <span className={choiceClassName}>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-foreground">Chi ha pagato</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {members.map((member) => (
                <label key={member.id} className="block">
                  <input
                    type="radio"
                    name="paidByUserId"
                    value={member.id}
                    checked={paidByUserId === member.id}
                    onChange={() => setPaidByUserId(member.id)}
                    className="peer sr-only"
                  />
                  <span className={`${choiceClassName} truncate`}>{member.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {isEdit ? (
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-full btn-outline-readable aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            <Link href={returnHref} aria-disabled={pending !== null || undefined}>
              Annulla
            </Link>
          </Button>
        ) : (
          <Button
            type="submit"
            value="another"
            variant="outline"
            disabled={pending !== null}
            className="h-11 rounded-full btn-outline-readable"
          >
            {pending === "another" ? "Salvataggio…" : "Salva e aggiungi un'altra"}
          </Button>
        )}
        <Button type="submit" value="back" disabled={pending !== null} className="h-11 rounded-full px-8 shadow-soft">
          {pending === "back" ? "Salvataggio…" : isEdit ? "Salva modifiche" : "Salva"}
        </Button>
      </div>
    </form>
  )
}
