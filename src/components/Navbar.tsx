import { Button } from "@/components/ui/button"
import { Search, Upload } from "lucide-react"

export default function Navbar() {
  return (
    <nav className="w-full h-16 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-xl">Smart Doc Tracker</h1>
      
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          Cerca
        </Button>
        <Button size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Carica Documento
        </Button>
        <div className="ml-2 text-sm text-gray-600 hover:text-black cursor-pointer">
          Login
        </div>
      </div>
    </nav>
  )
}