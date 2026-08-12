import { AccountControl } from "@/components/account-control"
import { AppShell } from "@/components/app-shell"
import { mockSession, mockSavedLooks } from "@/lib/mock-data"
import { Flame, Heart, Zap, Trophy, ChevronRight, Bell, Shield, HelpCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const stats = [
  { label: "Day Streak", value: mockSession.streak, icon: Flame, color: "text-accent" },
  { label: "Total Plays", value: mockSession.totalPlays, icon: Zap, color: "text-primary" },
  { label: "Saved Looks", value: mockSession.savedLooks, icon: Heart, color: "text-accent" },
  { label: "Challenges", value: 11, icon: Trophy, color: "text-primary" },
]

const menuItems = [
  { label: "Notifications", icon: Bell, href: "/profile/notifications" },
  { label: "Privacy & Data", icon: Shield, href: "/profile/privacy" },
  { label: "Help & FAQ", icon: HelpCircle, href: "/profile/help" },
]

export default function ProfilePage() {
  const recentLooks = mockSavedLooks.filter((l) => l.decision === "wear").slice(0, 3)

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
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat) => {
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
        </div>

        {/* Recent wears */}
        <div className="px-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Recent Wears
            </h2>
            <Link href="/saved" className="text-xs font-semibold text-primary">
              See all
            </Link>
          </div>
          <div className="flex gap-2">
            {recentLooks.map((look) => (
              <Link
                key={look.id}
                href={`/result/${look.tryOnId}`}
                className="relative flex-1 overflow-hidden rounded-2xl transition-all active:scale-95"
                style={{ aspectRatio: "2/3" }}
                aria-label={`View ${look.challengeTitle} look`}
              >
                <Image
                  src={look.resultImageUrl}
                  alt={`${look.challengeTitle} outfit`}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-2">
                  <span className="text-[9px] font-bold text-white">{look.challengeTitle}</span>
                </div>
              </Link>
            ))}
          </div>
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
