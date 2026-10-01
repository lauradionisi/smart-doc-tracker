import { redirect } from "next/navigation"
import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar"
import { getCurrentUser } from "@/lib/auth"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Cookie assente, scaduto o non valido: lo cancelliamo e torniamo al login
  // (qui i cookie sono in sola lettura, quindi passiamo da una route handler)
  if (!user) {
    redirect("/api/auth/session-expired")
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar userName={user.name ?? user.email} />
        {/* Colonna centrale con larghezza massima, per tutte le pagine */}
        <main className="p-4 md:p-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
