'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Upload, Settings, Users, Wallet, type LucideIcon } from "lucide-react"

type MenuItem = {
  href: string
  label: string
  icon: LucideIcon
  comingSoon?: boolean // pagina non ancora disponibile: voce visibile ma disattivata
}

const menuItems: MenuItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/expenses", label: "Spese", icon: Wallet },
  { href: "/documents", label: "Documenti", icon: FileText, comingSoon: true },
  { href: "/family", label: "Famiglia", icon: Users },
  { href: "/upload", label: "Carica", icon: Upload, comingSoon: true },
  { href: "/settings", label: "Impostazioni", icon: Settings, comingSoon: true },
]

function isActivePath(pathname: string, href: string) {
  // "/expenses" resta attiva anche su "/expenses/new"
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}

/** Voci del menu: usate nella Sidebar desktop e nel pannello mobile */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Menu principale">
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon

          if (item.comingSoon) {
            return (
              <li key={item.href}>
                <span
                  aria-disabled="true"
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-muted-foreground/60 cursor-not-allowed"
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    presto
                  </span>
                </span>
              </li>
            )
          }

          const isActive = isActivePath(pathname, item.href)

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-soft scale-105"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-102"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

/** Sidebar fissa: visibile solo da 768px in su (sotto c'è il pannello mobile) */
export default function Sidebar() {
  return (
    <aside className="hidden md:block w-64 shrink-0 min-h-screen border-r border-border/30 glass-card backdrop-blur-xl p-6">
      <div className="mb-8 px-3 pt-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          Menu
        </h2>
      </div>

      <SidebarNav />
    </aside>
  )
}
