"use client"

import Image from "next/image"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/client/auth-client"

export function AccountControl() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return null

  if (!session) {
    return (
      <Link
        href="/login"
        className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-sm font-semibold text-foreground shadow-sm transition-all active:scale-95"
      >
        Sign in
      </Link>
    )
  }

  const { name, email, image } = session.user

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-primary bg-primary/10">
        {image ? (
          <Image src={image} alt={name} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-black text-primary">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-black text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
      <button
        type="button"
        onClick={() => authClient.signOut()}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground transition-all active:scale-95"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        Sign Out
      </button>
    </div>
  )
}
