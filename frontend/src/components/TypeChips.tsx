import { EVENT_TYPES } from '../utils/eventTypes'

// Multi-select event-type filter. Tapping chips narrows the map/list to those
// types; with none selected, everything shows.
export default function TypeChips({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {EVENT_TYPES.map(t => {
        const active = value.includes(t.key)
        return (
          <button
            key={t.key}
            onClick={() => toggle(t.key)}
            aria-pressed={active}
            className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 border font-mono text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors ${
              active
                ? 'bg-ink text-paper-light border-ink'
                : 'bg-paper text-ink-mute border-ink/30 hover:text-ink hover:border-ink/60'
            }`}
          >
            <span className="text-[13px] leading-none">{t.emoji}</span>
            {t.label}
          </button>
        )
      })}
      {value.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="shrink-0 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-bridge-700 hover:text-bridge-500 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
