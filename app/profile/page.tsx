"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  AlertCircle,
  Bell,
  ChevronRight,
  Flame,
  HelpCircle,
  Shield,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react"
import { AccountControl } from "@/components/account-control"
import { AppShell } from "@/components/app-shell"
import type { ApiErrorResponse, GetProfileResponse, ProfileStats } from "@/lib/api-contracts"
import { authClient } from "@/lib/client/auth-client"
import { getChallengeById } from "@/lib/catalog/challenges"
import type { TryOn } from "@/lib/types"

const menuItems = [
  { label: "Notifications", icon: Bell, href: "/profile/notifications" },
  { label: "Privacy & Data", icon: Shield, href: "/profile/privacy" },
  { label: "Help & FAQ", icon: HelpCircle, href: "/profile/help" },
]

function buildStatCards(stats: ProfileStats) {
  return [
    { label: "Total Try-ons", value: stats.total, icon: Zap, color: "text-primary" },
    { label: "Wear", value: stats.wear, icon: Sparkles, color: "text-accent" },
    { label: "Dare", value: stats.dare, icon: Flame, color: "text-accent" },
    { label: "Challenges Tried", value: stats.challengesTried, icon: Trophy, color: "text-primary" },
  ]
}

export default function ProfilePage() {
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [recentWears, setRecentWears] = useState<TryOn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (isSessionPending || !session) return

    const controller = new AbortController()
    let active = true

    const loadProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/profile", {
          signal: controller.signal,
          cache: "no-store",
        })
        const data: GetProfileResponse | ApiErrorResponse = await response.json()
        if (!active) return

        if (!response.ok || !data.success) {
          setError(data.success ? "Unable to load profile data." : data.error)
          return
        }

        setStats(data.stats)
        setRecentWears(data.recentWears)
      } catch (requestError) {
        if (
          !active ||
          (requestError instanceof DOMException && requestError.name === "AbortError")
        ) {
          return
        }
        setError("We couldn’t load your profile. Please try again.")
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadProfile()
    return () => {
      active = false
      controller.abort()
    }
  }, [isSessionPending, session, reloadKey])

  const isLoadingStats = isSessionPending || (session && isLoading)
  const statCards = stats ? buildStatCards(stats) : null

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="px-5 pt-12 pb-6">
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ fontFamily: "var(--font-display, sans-serif)" }}
          >
            Your Profile
          </h1>
        </header>

        {/* Account */}
        <div className="px-5 mb-6">
          <AccountControl />
        </div>

        {/* Stats grid */}
        <div className="px-5 mb-6">
          {isLoadingStats ? (
            <div className="grid grid-cols-2 gap-3" aria-label="Loading stats">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex animate-pulse flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="h-5 w-5 rounded-full bg-secondary" />
                  <div className="h-6 w-10 rounded-full bg-secondary" />
                  <div className="h-3 w-16 rounded-full bg-secondary" />
                </div>
              ))}
            </div>
          ) : !session ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground shadow-sm">
              Sign in to see your try-on stats.
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </div>
              <button
                onClick={() => setReloadKey((current) => current + 1)}
                className="text-xs font-semibold text-primary"
              >
                Try again
              </button>
            </div>
          ) : statCards ? (
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>

        {/* Recent wears */}
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Recent Wears
            </h2>
            <Link href="/history" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>
          {isLoadingStats ? (
            <div className="flex gap-2" aria-label="Loading recent wears">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex-1 animate-pulse rounded-2xl bg-secondary"
                  style={{ aspectRatio: "2/3" }}
                />
              ))}
            </div>
          ) : !session || error ? null : recentWears.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-center text-xs text-muted-foreground shadow-sm">
              No wears yet. Complete a try-on and choose &ldquo;Wear&rdquo; to see it here.
            </div>
          ) : (
            <div className="flex gap-2">
              {recentWears.map((tryOn) => {
                const challenge = getChallengeById(tryOn.challengeId)
                return (
                  <Link
                    key={tryOn.id}
                    href={`/result/${encodeURIComponent(tryOn.id)}`}
                    className="relative flex-1 overflow-hidden rounded-2xl transition-all active:scale-95"
                    style={{ aspectRatio: "2/3" }}
                    aria-label={`View ${challenge?.title ?? "try-on"} look`}
                  >
                    <Image
                      src={tryOn.resultImageUrl}
                      alt={`${challenge?.title ?? "Try-on"} outfit`}
                      fill
                      sizes="33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <span className="text-[9px] font-bold text-white">
                        {challenge?.title ?? "Try-on"}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Menu */}
        <div className="px-5 mb-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {menuItems.map((item, i) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between p-4 ${i < menuItems.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground pb-8 mt-2">
          Wear or Dare v1.0 · Made with fashion chaos
        </p>
      </div>
    </AppShell>
  )
}
