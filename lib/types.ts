export type TryOnStatus = "pending" | "processing" | "completed" | "failed"

export interface UserSession {
  id: string
  createdAt: string
  streak: number
  totalPlays: number
  savedLooks: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: "Events" | "Decades" | "Moods" | "Wildcards"
  boldness: number // 1-5
  participationCount: number
  emoji: string
  color: string
}

export interface Garment {
  id: string
  name: string
  brand: string
  price: number
  category: string
  imageUrl: string
  tags: string[]
}

export interface TryOn {
  id: string
  sessionId: string
  challengeId: string
  garmentId: string
  sourceImageUrl: string
  resultImageUrl: string
  status: TryOnStatus
  decision: "wear" | "dare" | null
  verdict: string
  createdAt: string
}

export interface SavedLook {
  id: string
  tryOnId: string
  challengeId: string
  resultImageUrl: string
  challengeTitle: string
  garmentName: string
  decision: "wear" | "dare"
  verdict: string
  isFavorite: boolean
  createdAt: string
}

export interface Battle {
  id: string
  outfitAId: string
  outfitBId: string
  outfitAImageUrl: string
  outfitBImageUrl: string
  outfitAChallengeTitle: string
  outfitBChallengeTitle: string
  outfitAVotes: number
  outfitBVotes: number
  userVote: "A" | "B" | null
}

export interface Vote {
  battleId: string
  choice: "A" | "B"
  createdAt: string
}
