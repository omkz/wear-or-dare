import { Shield } from "lucide-react"

export function PrivacyBanner() {
  return (
    <section className="px-5 py-4">
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10" aria-hidden="true">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Your privacy is protected</p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            Your photo is only used to create your virtual look. We never store or share your images.
            No account required to play.
          </p>
        </div>
      </div>
    </section>
  )
}
