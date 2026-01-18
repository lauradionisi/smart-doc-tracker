'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Upload, Settings } from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()

  const menuItems = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/documents", label: "Documenti", icon: FileText },
    { href: "/upload", label: "Carica", icon: Upload },
    { href: "/settings", label: "Impostazioni", icon: Settings },
  ]

  return (
    <aside className="w-64 min-h-screen border-r border-border/30 glass-card backdrop-blur-xl p-6">
      <div className="mb-8 px-3 pt-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
          Menu
        </h2>
      </div>
      
      <ul className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <li key={item.href}>
              <Link 
                href={item.href} 
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
    </aside>
  )
}