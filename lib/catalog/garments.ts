import type { Garment } from "@/lib/types"

export const garments: Garment[] = [
  {
    id: "g-001",
    name: "Oversized Blazer",
    brand: "Acne Studios",
    price: 650,
    category: "Outerwear",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=600&fit=crop",
    tags: ["structured", "minimalist", "office"],
  },
  {
    id: "g-002",
    name: "Cargo Trousers",
    brand: "Off-White",
    price: 420,
    category: "Bottoms",
    imageUrl: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=600&fit=crop",
    tags: ["streetwear", "utility", "relaxed"],
  },
  {
    id: "g-003",
    name: "Slip Dress",
    brand: "Toteme",
    price: 380,
    category: "Dresses",
    imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=600&fit=crop",
    tags: ["minimal", "silk", "elegant"],
  },
  {
    id: "g-004",
    name: "Leather Moto Jacket",
    brand: "Saint Laurent",
    price: 2800,
    category: "Outerwear",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=600&fit=crop",
    tags: ["bold", "edgy", "iconic"],
  },
  {
    id: "g-005",
    name: "Festival Co-ord Set",
    brand: "ROTATE",
    price: 340,
    category: "Sets",
    imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=600&fit=crop",
    tags: ["festival", "colorful", "fun"],
  },
  {
    id: "g-006",
    name: "Structured Midi Skirt",
    brand: "The Row",
    price: 890,
    category: "Bottoms",
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5218ees33c?w=400&h=600&fit=crop",
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
