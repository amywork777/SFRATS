import { Check } from 'lucide-react'
import { EVENT_TYPES } from '../utils/eventTypes'
import FilterDropdown from './FilterDropdown'

// Multi-select event-type filter as a compact dropdown. With none selected,
// everything shows; the trigger shows an active count.
export default function TypeChips({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])
  const active = value.length > 0

  return (
    <FilterDropdown
      active={active}
      panelClassName="w-[210px]"
      label={<>Types{active ? ` · ${value.length}` : ''}</>}
    >
      {EVENT_TYPES.map(t => {
        const on = value.includes(t.key)
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => toggle(t.key)}
            aria-pressed={on}
            className={`w-full flex items-center gap-2.5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-left transition-colors ${
              on ? 'bg-ink text-paper-light' : 'text-ink-mute hover:bg-paper hover:text-ink'
            }`}
          >
            <span className="text-[14px] leading-none w-5 text-center">{t.emoji}</span>
            <span className="flex-1">{t.label}</span>
            {on && <Check size={13} strokeWidth={2.6} />}
          </button>
        )
      })}
      {active && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="w-full px-3 py-2 border-t border-ink/15 font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-700 hover:text-bridge-500 hover:bg-paper text-left transition-colors"
        >
          Clear all
        </button>
      )}
    </FilterDropdown>
  )
}
