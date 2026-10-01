"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

type CopyStatus = "idle" | "copied" | "error"

const RESET_AFTER_MS = 2000

export default function CopyButton({ value }: { value: string }) {
  const [status, setStatus] = useState<CopyStatus>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Annulla il timer se il componente viene smontato
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setStatus("copied")
    } catch {
      setStatus("error")
    }

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setStatus("idle"), RESET_AFTER_MS)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCopy}
      className="gap-2 rounded-full btn-outline-readable backdrop-blur-sm"
    >
      {status === "copied" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span aria-live="polite">
        {status === "copied" ? "Copiato!" : status === "error" ? "Copia non riuscita" : "Copia"}
      </span>
    </Button>
  )
}
