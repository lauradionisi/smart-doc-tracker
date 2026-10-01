import { Button } from "@/components/ui/button"
import { Search, Upload } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import LogoutButton from "@/components/LogoutButton"

export default function Navbar({ userName }: { userName: string }) {
  return (
    <nav className="w-full h-16 glass-card border-b border-border/30 backdrop-blur-xl flex items-center justify-between px-6">
      <h1 className="font-bold text-xl text-foreground">Smart Doc Tracker</h1>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2 rounded-full btn-outline-readable backdrop-blur-sm">
          <Search className="h-4 w-4" />
          Cerca
        </Button>
        <Button size="sm" className="gap-2 rounded-full shadow-soft">
          <Upload className="h-4 w-4" />
          Carica Documento
        </Button>
        
        <ThemeToggle />
        
        <span className="ml-2 text-sm font-medium text-foreground">{userName}</span>
        <LogoutButton />
      </div>
    </nav>
  )
}