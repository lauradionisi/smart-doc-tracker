import InlineNotFound from "@/components/InlineNotFound"

// 404 generica dentro l'app, mostrata quando una pagina di (app) chiama notFound()
export default function AppNotFound() {
  return (
    <InlineNotFound
      title="Pagina non trovata"
      description="Quello che cerchi non c'è o non è più disponibile."
      linkHref="/"
      linkLabel="Torna alla dashboard"
    />
  )
}
