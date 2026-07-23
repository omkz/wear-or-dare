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
            Your photo is stored for the try-on and may be sent to YouCam for AI processing.
            It is not publicly shared.
          </p>
        </div>
      </div>
    </section>
  )
}
