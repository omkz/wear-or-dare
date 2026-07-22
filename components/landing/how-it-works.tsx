import { Camera, Shuffle, Heart } from "lucide-react"

const steps = [
  {
    icon: Camera,
    title: "Upload your photo",
    description: "Take or upload a full-body photo. We keep it private.",
    number: "01",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Shuffle,
    title: "Spin a style challenge",
    description: "Spin the roulette and let fate choose your fashion dare.",
    number: "02",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Heart,
    title: "Wear it or dare again",
    description: "See your AI try-on result and decide: keep it or spin again.",
    number: "03",
    color: "bg-primary/10 text-primary",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-5 py-8">
      <h2
        className="mb-6 text-2xl font-black tracking-tight text-balance"
        style={{ fontFamily: "var(--font-display, sans-serif)" }}
      >
        How it works
      </h2>
      <div className="flex flex-col gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div
              key={idx}
              className="flex items-start gap-4 rounded-2xl bg-card p-4 shadow-sm border border-border"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${step.color}`}
                aria-hidden="true"
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-muted-foreground tracking-widest">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-bold text-foreground text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
