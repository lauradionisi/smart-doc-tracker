"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

type Status = "idle" | "confirming" | "deleting"

/** Elimina con conferma in linea: "Eliminare? Sì / Annulla" */
export default function DeleteExpenseButton({ expenseId, label }: { expenseId: string; label: string }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [error, setError] = useState<string | null>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const trashRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  // Focus su "Annulla" quando compare la conferma, e di nuovo sul cestino quando si annulla
  useEffect(() => {
    if (status === "confirming") {
      cancelRef.current?.focus()
      wasConfirming.current = true
    } else if (status === "idle" && wasConfirming.current) {
      trashRef.current?.focus()
      wasConfirming.current = false
    }
  }, [status])

  async function handleDelete() {
    setStatus("deleting")
    setError(null)
    try {
      const res = await fetch(`/api/expenses/${encodeURIComponent(expenseId)}`, { method: "DELETE" })
      // 404: già cancellata (es. da un altro membro) -> aggiorniamo comunque la lista
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? "Eliminazione non riuscita")
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eliminazione non riuscita")
      setStatus("confirming")
    }
  }

  if (status === "idle") {
    return (
      <Button
        ref={trashRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setStatus("confirming")}
        aria-label={`Elimina: ${label}`}
        className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div
      role="group"
      aria-label={`Conferma eliminazione: ${label}`}
      className="flex flex-wrap items-center justify-end gap-1"
      onKeyDown={(e) => {
        if (e.key === "Escape" && status === "confirming") setStatus("idle")
      }}
    >
      <span className="text-sm text-muted-foreground mr-1">
        {error ? <span role="alert" className="text-destructive">{error}</span> : "Eliminare?"}
      </span>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={status === "deleting"}
        className="rounded-full"
      >
        {status === "deleting" ? "…" : "Sì"}
      </Button>
      <Button
        ref={cancelRef}
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setStatus("idle")}
        disabled={status === "deleting"}
        className="rounded-full btn-outline-readable"
      >
        Annulla
      </Button>
    </div>
  )
}
