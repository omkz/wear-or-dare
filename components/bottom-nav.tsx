"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const isActive = pathname === "/play"

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-center justify-center px-4 pb-safe">
        <Link
          href="/play"
          className="flex -mt-5 flex-col items-center gap-0.5"
          aria-label="Play"
          aria-current={isActive ? "page" : undefined}
        >
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg transition-all duration-200",
              isActive ? "scale-110 pulse-ring" : "hover:scale-105 active:scale-95"
            )}
          >
            <Zap className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold tracking-wide",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            Play
          </span>
        </Link>
      </div>
    </nav>
  )
}
