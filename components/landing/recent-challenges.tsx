import Link from "next/link"
import { challenges } from "@/lib/catalog/challenges"
import { BoldnessIndicator } from "@/components/boldness-indicator"

export function RecentChallenges() {
  const featured = challenges.slice(0, 4)

  return (
    <section className="px-5 py-6">
      <div className="mb-5">
        <h2
          className="text-2xl font-black tracking-tight"
          style={{ fontFamily: "var(--font-display, sans-serif)" }}
        >
          Trending Dares
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {featured.map((challenge) => (
          <Link
            key={challenge.id}
            href="/photo"
            className="group flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all active:scale-95 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl" role="img" aria-label={challenge.title}>
                {challenge.emoji}
              </span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {challenge.category}
              </span>
            </div>
            <h3 className="font-bold text-foreground text-sm leading-tight text-balance">
              {challenge.title}
            </h3>
            <BoldnessIndicator level={challenge.boldness} />
          </Link>
        ))}
      </div>
    </section>
  )
}
