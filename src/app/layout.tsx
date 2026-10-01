import type { Metadata } from "next"
import "./globals.css"

// Eseguito dal browser prima del primo disegno della pagina: applica subito il tema
// salvato (o quello del sistema) ed evita il flash del tema chiaro.
// Stesse regole di ThemeToggle.
const themeScript = `(function () {
  try {
    var theme = localStorage.getItem("theme");
    if (theme !== "dark" && theme !== "light") {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {}
})();`

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
    // suppressHydrationWarning: la classe "dark" su <html> viene aggiunta dallo script
    // prima che React prenda il controllo, quindi differisce dall'HTML del server
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  )
}
