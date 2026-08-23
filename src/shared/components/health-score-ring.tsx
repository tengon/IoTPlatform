'use client'

interface HealthScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981' // green
  if (score >= 75) return '#eab308' // yellow
  if (score >= 60) return '#f97316' // orange
  return '#ef4444' // red
}

export function HealthScoreRing({
  score,
  size = 48,
  strokeWidth = 4,
  className = '',
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreColor(score)
  const fontSize = size < 40 ? 10 : size < 56 ? 12 : 14

  return (
    <div className={`inline-flex items-center justify-center opacity-80 ${className}`}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="health-ring-animate"
        />
      </svg>
      {/* Score text */}
      <span
        className="absolute metric-value font-bold"
        style={{
          fontSize,
          color,
          lineHeight: 1,
        }}
      >
        {score}
      </span>
    </div>
  )
}
