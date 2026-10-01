"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PasswordInput from "@/components/PasswordInput"

const inputClassName =
  "h-11 rounded-xl border-border/50 bg-background/50 text-foreground focus:bg-background focus:border-primary/50"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Si è verificato un errore. Riprova.")
        setLoading(false)
        return
      }

      // Il pulsante resta disattivato durante la navigazione
      router.push("/")
      router.refresh()
    } catch {
      setError("Impossibile contattare il server. Riprova.")
      setLoading(false)
    }
  }

  return (
    <Card className="glass-card shadow-soft rounded-3xl border-border/30">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Accedi</CardTitle>
        <CardDescription>Entra nel tuo account per gestire i documenti</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClassName}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full shadow-soft"
          >
            {loading ? "Accesso…" : "Accedi"}
          </Button>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Non hai un account?{" "}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Registrati
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
