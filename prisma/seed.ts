import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Categorie predefinite: familyId null, isDefault true.
// L'id fisso rende il seed idempotente: upsert aggiorna invece di duplicare.
const DEFAULT_CATEGORIES = [
  { id: "default-casa", name: "Casa", icon: "🏠", color: "#8b5cf6" },
  { id: "default-bollette", name: "Bollette", icon: "💡", color: "#eab308" },
  { id: "default-spesa", name: "Spesa", icon: "🛒", color: "#22c55e" },
  { id: "default-auto-trasporti", name: "Auto e trasporti", icon: "🚗", color: "#3b82f6" },
  { id: "default-animali", name: "Animali", icon: "🐾", color: "#a16207" },
  { id: "default-figli", name: "Figli", icon: "👶", color: "#ec4899" },
  { id: "default-salute", name: "Salute", icon: "🩺", color: "#ef4444" },
  { id: "default-ristoranti-uscite", name: "Ristoranti e uscite", icon: "🍽️", color: "#f97316" },
  { id: "default-tempo-libero-viaggi", name: "Tempo libero e viaggi", icon: "✈️", color: "#06b6d4" },
  { id: "default-persona", name: "Persona", icon: "👕", color: "#d946ef" },
  { id: "default-tasse-assicurazioni", name: "Tasse e assicurazioni", icon: "📑", color: "#64748b" },
  { id: "default-altro", name: "Altro", icon: "📦", color: "#78716c" },
];

async function main() {
  for (const { id, name, icon, color } of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id },
      create: { id, name, icon, color, familyId: null, isDefault: true },
      update: { name, icon, color, familyId: null, isDefault: true },
    });
  }

  const total = await prisma.category.count({ where: { familyId: null, isDefault: true } });
  console.log(`Categorie predefinite: ${DEFAULT_CATEGORIES.length} sincronizzate, ${total} nel database`);
}

main()
  .catch((error) => {
    console.error("Errore durante il seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
