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
    <aside className="w-64 min-h-screen border-r bg-gray-50 p-4">
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Menu
        </h2>
      </div>
      
      <ul className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <li key={item.href}>
              <Link 
                href={item.href} 
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-blue-50 text-blue-700 font-medium" 
                    : "text-gray-700 hover:bg-gray-100"
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