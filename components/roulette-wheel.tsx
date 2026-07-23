"use client"

import { useState, useRef, useCallback } from "react"
import { mockChallenges } from "@/lib/mock-data"
import type { Challenge } from "@/lib/types"
import { cn } from "@/lib/utils"

interface RouletteWheelProps {
  onResult: (challenge: Challenge) => void
  disabled?: boolean
}

const SEGMENT_COLORS = [
  "#7C3AED", "#FF6B6B", "#F59E0B", "#06B6D4",
  "#EC4899", "#10B981", "#EF4444", "#8B5CF6",
]

const CHALLENGES = mockChallenges.slice(0, 8)
const TOTAL = CHALLENGES.length
const SEGMENT_ANGLE = 360 / TOTAL

export function RouletteWheel({ onResult, disabled }: RouletteWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const currentRotation = useRef(0)

  const spin = useCallback(() => {
    if (isSpinning || disabled) return

    setIsSpinning(true)
    setSelectedIndex(null)

    const extraSpins = 5 + Math.floor(Math.random() * 5) // 5-9 full rotations
    const targetIndex = Math.floor(Math.random() * TOTAL)
    // We want the pointer (at top = 270deg offset) to land on targetIndex
    // Each segment starts at: index * SEGMENT_ANGLE, centered at: (index + 0.5) * SEGMENT_ANGLE
    // Pointer is at top (270 deg in standard coords). Wheel rotates clockwise.
    // To land segment i at top: rotate so that i * SEGMENT_ANGLE + SEGMENT_ANGLE/2 = 270 + n*360
    const targetAngle = (270 - (targetIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2) + 360 * extraSpins) % 360 + 360 * extraSpins
    const newRotation = currentRotation.current + targetAngle

    currentRotation.current = newRotation
    setRotation(newRotation)

    setTimeout(() => {
      setIsSpinning(false)
      setSelectedIndex(targetIndex)
      onResult(CHALLENGES[targetIndex])
    }, 3200)
  }, [isSpinning, disabled, onResult])

  const size = 280
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 4

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Pointer */}
      <div className="relative flex items-center justify-center">
        {/* Pointer arrow */}
        <div
          className="absolute -top-3 z-10 h-6 w-4"
          aria-hidden="true"
          style={{
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            background: "#1F2937",
          }}
        />

        {/* Wheel */}
        <div
          className={cn("relative select-none", isSpinning && "pointer-events-none")}
          style={{
            width: size,
            height: size,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning
              ? "transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
              : "none",
          }}
          aria-label="Fashion roulette wheel"
          role="img"
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {CHALLENGES.map((challenge, i) => {
              const startAngle = ((i * SEGMENT_ANGLE - 90) * Math.PI) / 180
              const endAngle = (((i + 1) * SEGMENT_ANGLE - 90) * Math.PI) / 180
              const x1 = cx + r * Math.cos(startAngle)
              const y1 = cy + r * Math.sin(startAngle)
              const x2 = cx + r * Math.cos(endAngle)
              const y2 = cy + r * Math.sin(endAngle)
              const midAngle = (startAngle + endAngle) / 2
              const textR = r * 0.68
              const tx = cx + textR * Math.cos(midAngle)
              const ty = cy + textR * Math.sin(midAngle)
              const textAngleDeg = (midAngle * 180) / Math.PI + 90

              return (
                <g key={challenge.id}>
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                    fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                    stroke="white"
                    strokeWidth="2"
                  />
                  <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="11"
                    fontWeight="700"
                    transform={`rotate(${textAngleDeg}, ${tx}, ${ty})`}
                    style={{ pointerEvents: "none" }}
                  >
                    {challenge.title.length > 9 ? challenge.title.slice(0, 8) + "…" : challenge.title}
                  </text>
                </g>
              )
            })}
            {/* Center circle */}
            <circle cx={cx} cy={cy} r={28} fill="white" stroke="#E5E7EB" strokeWidth="2" />
            <text
              x={cx}
              y={cy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="20"
              style={{ userSelect: "none" }}
            >
              🎰
            </text>
          </svg>
        </div>
      </div>

      {/* Selected challenge pill */}
      {selectedIndex !== null && !isSpinning && (
        <div
          className="pop-in rounded-2xl px-5 py-2.5 text-center"
          style={{ background: SEGMENT_COLORS[selectedIndex % SEGMENT_COLORS.length] }}
        >
          <p className="text-sm font-black text-white">
            {CHALLENGES[selectedIndex].emoji} {CHALLENGES[selectedIndex].title}
          </p>
        </div>
      )}

      {/* Spin button */}
      <button
        onClick={spin}
        disabled={isSpinning || disabled}
        className={cn(
          "relative h-16 w-48 rounded-2xl text-base font-black text-white shadow-xl transition-all",
          isSpinning || disabled
            ? "cursor-not-allowed opacity-60 bg-primary"
            : "bg-primary active:scale-95 hover:opacity-90 pulse-ring"
        )}
        aria-label={isSpinning ? "Spinning..." : "Spin the wheel"}
      >
        {isSpinning ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
            Spinning…
          </span>
        ) : (
          "SPIN"
        )}
      </button>
    </div>
  )
}
