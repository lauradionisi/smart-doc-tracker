'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'

function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},   // subscribe (no-op)
    () => true,       // snapshot client
    () => false       // snapshot server
  )
}

export default function ThemeToggle() {
  const mounted = useHasMounted()

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  if (!mounted) {
    return <div className="w-10 h-10 rounded-full border border-border/50 bg-muted/50" />
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 btn-icon-readable transition-all hover:scale-110"
      aria-label={theme === 'light' ? 'Attiva dark mode' : 'Attiva light mode'}
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5 transition-transform duration-300" />
      ) : (
        <Sun className="h-5 w-5 transition-transform duration-300" />
      )}
    </Button>
  )
}
