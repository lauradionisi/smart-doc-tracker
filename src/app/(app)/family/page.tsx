import { redirect } from "next/navigation"
import { Users } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import CopyButton from "@/components/CopyButton"

export const metadata = {
  title: "Famiglia | Smart Doc Tracker",
}

const dateFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export default async function FamilyPage() {
  // Layout e pagina vengono renderizzati in parallelo: la pagina verifica da sola
  const user = await getCurrentUser()
  if (!user) {
    redirect("/api/auth/session-expired")
  }

  // Una persona appartiene a una sola famiglia
  const membership = await prisma.familyMember.findFirst({
    where: { userId: user.id },
    select: {
      family: {
        select: {
          name: true,
          inviteCode: true,
          members: {
            orderBy: { joinedAt: "asc" },
            select: {
              id: true,
              joinedAt: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  })

  if (!membership) {
    return (
      <div className="space-y-8 p-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Famiglia</h1>
        <div className="glass-card rounded-3xl shadow-soft p-8 text-muted-foreground">
          Non fai ancora parte di nessuna famiglia.
        </div>
      </div>
    )
  }

  const { family } = membership

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{family.name}</h1>
        <p className="text-muted-foreground mt-2 text-lg">La tua famiglia</p>
      </div>

      {/* Codice invito */}
      <section
        aria-labelledby="invite-code-title"
        className="glass-card rounded-3xl shadow-soft p-8 space-y-4"
      >
        <h2 id="invite-code-title" className="text-sm font-medium text-muted-foreground">
          Codice invito
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <p className="font-mono text-4xl font-bold tracking-widest text-foreground select-all">
            {family.inviteCode}
          </p>
          <CopyButton value={family.inviteCode} />
        </div>

        <p className="text-sm text-muted-foreground">
          Condividi questo codice: chi si registra con questo codice entra nella tua famiglia.
        </p>
      </section>

      {/* Membri */}
      <section
        aria-labelledby="members-title"
        className="glass-card rounded-3xl shadow-soft p-8 space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-primary/20 p-3">
            <Users className="h-5 w-5 text-foreground" />
          </div>
          <h2 id="members-title" className="text-xl font-semibold text-foreground">
            Membri ({family.members.length})
          </h2>
        </div>

        <ul className="divide-y divide-border/40">
          {family.members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-4">
              <span className="font-medium text-foreground">
                {member.user.name ?? member.user.email}
                {member.user.id === user.id && (
                  <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-foreground">
                    Tu
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                Membro dal{" "}
                <time dateTime={member.joinedAt.toISOString()}>
                  {dateFormatter.format(member.joinedAt)}
                </time>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
