import type { Garment } from "@/lib/types"

export const garments: Garment[] = [
  {
    id: "g-001",
    name: "Oversized Blazer",
    brand: "Acne Studios",
    price: 650,
    category: "Outerwear",
    imageUrl: "/garments/g-001%20Oversized%20Blazer.png",
    tags: ["structured", "minimalist", "office"],
  },
  {
    id: "g-002",
    name: "Cargo Trousers",
    brand: "Off-White",
    price: 420,
    category: "Bottoms",
    imageUrl: "/garments/g-002%20Cargo%20Trousers.png",
    tags: ["streetwear", "utility", "relaxed"],
  },
  {
    id: "g-003",
    name: "Slip Dress",
    brand: "Toteme",
    price: 380,
    category: "Dresses",
    imageUrl: "/garments/g-003%20Slip%20Dress.png",
    tags: ["minimal", "silk", "elegant"],
  },
  {
    id: "g-004",
    name: "Leather Moto Jacket",
    brand: "Saint Laurent",
    price: 2800,
    category: "Outerwear",
    imageUrl: "/garments/g-004%20Leather%20Jacket.png",
    tags: ["bold", "edgy", "iconic"],
  },
  {
    id: "g-005",
    name: "Festival Co-ord Set",
    brand: "ROTATE",
    price: 340,
    category: "Sets",
    imageUrl: "/garments/g-005%20Festival%20Set.png",
    tags: ["festival", "colorful", "fun"],
  },
  {
    id: "g-006",
    name: "Structured Midi Skirt",
    brand: "The Row",
    price: 890,
    category: "Bottoms",
    imageUrl: "/garments/g-006%20Midi%20Skirt.png",
    tags: ["quiet luxury", "structured", "elegant"],
  },
]

export const garmentIdByChallenge: Readonly<Record<string, string>> = {
  "ch-001": "g-003",
  "ch-002": "g-006",
  "ch-003": "g-002",
  "ch-004": "g-005",
  "ch-005": "g-004",
  "ch-006": "g-001",
  "ch-007": "g-003",
  "ch-008": "g-005",
  "ch-009": "g-001",
  "ch-010": "g-004",
  "ch-011": "g-005",
}

export function getGarmentById(garmentId: string): Garment | null {
  return garments.find((garment) => garment.id === garmentId) ?? null
}

export function getGarmentForChallenge(challengeId: string): Garment | null {
  const garmentId = garmentIdByChallenge[challengeId]
  return garmentId ? getGarmentById(garmentId) : null
}
