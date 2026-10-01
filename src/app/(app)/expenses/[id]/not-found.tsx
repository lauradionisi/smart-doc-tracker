import InlineNotFound from "@/components/InlineNotFound"

// Spesa inesistente o di un'altra famiglia (stessa risposta per entrambi i casi)
export default function ExpenseNotFound() {
  return (
    <InlineNotFound
      title="Spesa non trovata"
      description="Questa spesa non esiste o è stata eliminata."
      linkHref="/expenses"
      linkLabel="Torna alle spese"
    />
  )
}
