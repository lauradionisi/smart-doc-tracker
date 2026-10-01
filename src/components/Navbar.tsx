import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import LogoutButton from "@/components/LogoutButton"
import MobileNav from "@/components/MobileNav"
import NewMenu from "@/components/NewMenu"

export default function Navbar({ userName }: { userName: string }) {
  return (
    <header className="sticky top-0 z-30 w-full h-16 glass-card border-b border-border/30 backdrop-blur-xl flex items-center justify-between gap-3 px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <span className="truncate font-bold text-lg md:text-xl text-foreground">Smart Doc Tracker</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-2 rounded-full btn-outline-readable backdrop-blur-sm">
          <Search className="h-4 w-4" />
          Cerca
        </Button>

        <NewMenu />

        <ThemeToggle />

        <span className="hidden sm:inline ml-2 text-sm font-medium text-foreground">{userName}</span>
        <LogoutButton />
      </div>
    </header>
  )
}
