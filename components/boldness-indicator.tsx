import { cn } from "@/lib/utils"

interface BoldnessIndicatorProps {
  level: number // 1-5
  className?: string
}

export function BoldnessIndicator({ level, className }: BoldnessIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} aria-label={`Boldness level ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-4 rounded-full transition-all",
            i < level ? "bg-primary" : "bg-border"
          )}
        />
      ))}
    </div>
  )
}
