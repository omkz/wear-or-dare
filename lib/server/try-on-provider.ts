import "server-only"
import type { TryOnProvider } from "@/lib/types"

export class TryOnProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TryOnProviderConfigurationError"
  }
}

export function getTryOnProvider(): TryOnProvider {
  const value = (process.env.TRY_ON_PROVIDER ?? "mock").trim().toLowerCase()

  if (value === "mock" || value === "youcam") return value
  throw new TryOnProviderConfigurationError(
    "TRY_ON_PROVIDER must be either mock or youcam"
  )
}
