"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import PasswordInput from "@/components/PasswordInput"

type FamilyMode = "create" | "join"

const inputClassName =
  "h-11 rounded-xl border-border/50 bg-background/50 text-foreground focus:bg-background focus:border-primary/50"

export default function RegisterPage() {
  const router = useRouter()
  const [mode, setMode] = useState<FamilyMode>("create")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Controllo solo lato client: se non coincidono non inviamo la richiesta
    if (password !== confirmPassword) {
      setConfirmError("Le password non coincidono")
      document.getElementById("confirmPassword")?.focus()
      return
    }

    setLoading(true)

    // Inviamo solo il campo della scelta attiva
    const body =
      mode === "create"
        ? { name, email, password, familyName }
        : { name, email, password, inviteCode }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Si è verificato un errore. Riprova.")
        setLoading(false)
        return
      }

      // La registrazione fa già il login: andiamo alla dashboard
      router.push("/")
      router.refresh()
    } catch {
      setError("Impossibile contattare il server. Riprova.")
      setLoading(false)
    }
  }

  function modeButtonClassName(active: boolean) {
    return `flex-1 rounded-full backdrop-blur-sm ${active ? "" : "btn-outline-readable"}`
  }

  return (
    <Card className="glass-card shadow-soft rounded-3xl border-border/30">
      <CardHeader>
        <CardTitle className="text-2xl text-foreground">Crea un account</CardTitle>
        <CardDescription>Registrati e inizia a organizzare i documenti della tua famiglia</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="mb-6 flex gap-2" role="group" aria-label="Scegli come entrare in una famiglia">
          <Button
            type="button"
            variant={mode === "create" ? "default" : "outline"}
            aria-pressed={mode === "create"}
            onClick={() => setMode("create")}
            className={modeButtonClassName(mode === "create")}
          >
            Crea una famiglia
          </Button>
          <Button
            type="button"
            variant={mode === "join" ? "default" : "outline"}
            aria-pressed={mode === "join"}
            onClick={() => setMode("join")}
            className={modeButtonClassName(mode === "join")}
          >
            Ho un codice invito
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClassName}
            />
          </div>

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
              autoComplete="new-password"
              required
              minLength={6}
              aria-describedby="password-hint"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setConfirmError(null)
              }}
              className={inputClassName}
            />
            <p id="password-hint" className="text-xs text-muted-foreground">
              Almeno 6 caratteri
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Conferma password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              required
              aria-invalid={confirmError ? true : undefined}
              aria-describedby={confirmError ? "confirm-password-error" : undefined}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setConfirmError(null)
              }}
              className={inputClassName}
            />
            {confirmError && (
              <p id="confirm-password-error" role="alert" className="text-sm text-destructive">
                {confirmError}
              </p>
            )}
          </div>

          {mode === "create" ? (
            <div className="space-y-2">
              <label htmlFor="familyName" className="text-sm font-medium text-foreground">
                Nome della famiglia
              </label>
              <Input
                id="familyName"
                name="familyName"
                type="text"
                autoComplete="off"
                required
                placeholder="Es. Bianchi"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className={inputClassName}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="inviteCode" className="text-sm font-medium text-foreground">
                Codice invito
              </label>
              <Input
                id="inviteCode"
                name="inviteCode"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                required
                placeholder="Es. K7M2-X9PQ"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className={`${inputClassName} uppercase tracking-wider`}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full shadow-soft"
          >
            {loading ? "Registrazione…" : "Registrati"}
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
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Accedi
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
