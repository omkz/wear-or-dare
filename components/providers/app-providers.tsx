"use client"

import type { ReactNode } from "react"
import { PhotoSessionProvider } from "@/components/providers/photo-session-provider"

export function AppProviders({ children }: { children: ReactNode }) {
  return <PhotoSessionProvider>{children}</PhotoSessionProvider>
}
