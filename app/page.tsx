import { HeroSection } from "@/components/landing/hero-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { RecentChallenges } from "@/components/landing/recent-challenges"
import { PrivacyBanner } from "@/components/landing/privacy-banner"
import Link from "next/link"
import { Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        <HeroSection />
        <HowItWorks />
        <RecentChallenges />
        <PrivacyBanner />

        {/* Bottom CTA */}
        <section className="px-5 pt-2 pb-12">
          <Link
            href="/photo"
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-base font-bold text-primary-foreground shadow-lg transition-all active:scale-95 hover:opacity-90"
          >
            <Zap className="h-5 w-5" aria-hidden="true" />
            Start Playing — It&apos;s Free
          </Link>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            No signup required. Just upload and spin.
          </p>
        </section>
      </div>
    </div>
  )
}
