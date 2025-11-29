'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen border-r bg-gray-50 p-4">
      <ul className="space-y-2">
        <li>
          <Link 
            href="/" 
            className={`block p-2 rounded ${pathname === "/" ? "bg-gray-200 font-medium" : ""}`}
          >
            Home
          </Link>
        </li>
        <li>
          <Link 
            href="/dashboard" 
            className={`block p-2 rounded ${pathname === "/dashboard" ? "bg-gray-200 font-medium" : ""}`}
          >
            Dashboard
          </Link>
        </li>
      </ul>
    </aside>
  )
}
