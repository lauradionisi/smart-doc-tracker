import type { Metadata } from "next"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar"

export const metadata: Metadata = {
  title: "Smart Doc Tracker",
  description: "Gestione documenti e scadenze personale",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className="flex min-h-screen bg-white text-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="p-6">{children}</main>
        </div>
      </body>
    </html>
  )
}
