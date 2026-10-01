"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "@/components/Sidebar"

/** Pulsante ☰ + pannello laterale con il menu: solo sotto i 768px */
export default function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden rounded-full w-10 h-10 btn-icon-readable"
          aria-label="Apri il menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* --background è un gradiente: per un pannello opaco serve il colore pieno */}
      <SheetContent
        side="left"
        className="w-72 p-6 bg-[var(--background-solid)] border-border/30"
        aria-describedby={undefined}
      >
        <SheetHeader className="p-0 pt-4 mb-4">
          <SheetTitle className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </SheetTitle>
        </SheetHeader>

        {/* Chiude il pannello dopo aver scelto una pagina */}
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  )
}
