"use client"

import Link from "next/link"
import { FileText, Plus, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Pulsante "+ Nuovo" con menu. Radix gestisce la tastiera:
 * Invio/Spazio/↓ aprono, frecce per muoversi, Esc chiude e riporta il focus al pulsante.
 */
export default function NewMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-2 rounded-full shadow-soft">
          <Plus className="h-4 w-4" />
          Nuovo
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        <DropdownMenuItem asChild className="cursor-pointer py-2">
          <Link href="/expenses/new">
            <Wallet className="h-4 w-4" />
            Spesa
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem disabled className="py-2">
          <FileText className="h-4 w-4" />
          Documento
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            presto
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
