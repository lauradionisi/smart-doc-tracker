import { Card } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Dashboard!</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">📄 Documento 1</Card>
        <Card className="p-4">📄 Documento 2</Card>
        <Card className="p-4">📄 Documento 3</Card>
      </div>
    </div>
  )
}
