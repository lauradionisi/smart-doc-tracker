import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"

/** 404 dentro l'app (con Sidebar e Navbar): titolo, testo e un link per tornare */
export default function InlineNotFound({
  title,
  description,
  linkHref,
  linkLabel,
}: {
  title: string
  description: string
  linkHref: string
  linkLabel: string
}) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="glass-card shadow-soft rounded-3xl px-8 py-12 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary shadow-soft">
          <FileQuestion className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-muted-foreground">{description}</p>
        <Button asChild className="mt-8 h-11 rounded-full px-6 shadow-soft">
          <Link href={linkHref}>{linkLabel}</Link>
        </Button>
      </div>
    </div>
  )
}
