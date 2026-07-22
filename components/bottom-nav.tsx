"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, Swords, Bookmark, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/play", label: "Play", icon: Zap, isPrimary: true },
  { href: "/challenges", label: "Challenges", icon: Swords, isPrimary: false },
  { href: "/saved", label: "Saved", icon: Bookmark, isPrimary: false },
  { href: "/profile", label: "Profile", icon: User, isPrimary: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 -mt-5"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
                    isActive
                      ? "bg-primary scale-110 pulse-ring"
                      : "bg-primary hover:scale-105 active:scale-95"
                  )}
                >
                  <Icon className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-wide",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 py-2 px-3 min-h-[56px] justify-center"
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
