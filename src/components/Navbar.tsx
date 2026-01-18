import { Button } from "@/components/ui/button"
import { Search, Upload } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"

export default function Navbar() {
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
        
        <div className="ml-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
          Login
        </div>
      </div>
    </nav>
  )
}