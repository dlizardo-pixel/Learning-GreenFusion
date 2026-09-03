interface Props {
  value: number
  max: number
  size?: number
  label?: string
}

/** Fortschrittsring für das Tagesziel. */
export function Ring({ value, max, size = 84, label }: Props) {
  const r = (size - 10) / 2
  const c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(1, value / max) : 0

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--gf-primary)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 400ms cubic-bezier(0.2,0,0,1)' }}
        />
      </svg>
      <span className="ring-label">{label ?? `${Math.round(pct * 100)}%`}</span>
    </div>
  )
}
