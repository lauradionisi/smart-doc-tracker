"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Errore logout:", error)
    } finally {
      // Anche se la richiesta fallisce torniamo al login
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="gap-2 rounded-full btn-outline-readable backdrop-blur-sm"
    >
      <LogOut className="h-4 w-4" />
      {/* Su mobile solo l'icona: il testo resta per gli screen reader */}
      <span className="sr-only sm:not-sr-only">{loading ? "Uscita…" : "Esci"}</span>
    </Button>
  )
}
