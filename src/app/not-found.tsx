import type { Metadata } from "next"
import Link from "next/link"
import { FileQuestion, House } from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ThemeToggle"

export const metadata: Metadata = {
  title: "Pagina non trovata | Smart Doc Tracker",
}

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="glass-card shadow-soft-lg rounded-3xl w-full max-w-lg px-8 py-12 text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary shadow-soft">
          <FileQuestion className="h-10 w-10 text-primary-foreground" aria-hidden="true" />
        </div>

        <p className="text-8xl font-bold tracking-tighter text-foreground" aria-hidden="true">
          404
        </p>

        <h1 className="mt-4 text-2xl font-semibold text-foreground">Pagina non trovata</h1>

        <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
          Abbiamo cercato in tutto l&apos;archivio, ma questa pagina non c&apos;è.
          Forse è stata spostata o l&apos;indirizzo non è corretto.
        </p>

        <Button asChild className="mt-8 h-11 gap-2 rounded-full px-6 shadow-soft">
          <Link href="/">
            <House className="h-4 w-4" />
            Torna alla dashboard
          </Link>
        </Button>
      </main>
    </div>
  )
}
