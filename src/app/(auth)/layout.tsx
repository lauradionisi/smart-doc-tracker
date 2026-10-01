import ThemeToggle from "@/components/ThemeToggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <h1 className="mb-8 text-2xl font-bold text-foreground">Smart Doc Tracker</h1>

      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
