import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { EVENT_TYPES } from '../utils/eventTypes'

// Compact multi-select event-type filter. A single dropdown chip keeps the top
// bar tight; opening it reveals the types as toggle rows. With none selected,
// everything shows. Styled to match the DatePicker chips/popover.
export default function TypeChips({
  value,
  onChange,
}: {
  value: string[]
  onChange: (next: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = value.length > 0

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter(k => k !== key) : [...value, key])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors whitespace-nowrap ${
          active
            ? 'bg-bridge-500 text-paper-light shadow-stamp'
            : 'bg-paper-light text-ink-mute hover:text-ink hover:bg-paper'
        }`}
      >
        Types{active ? ` · ${value.length}` : ''}
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[1500] w-[210px] max-w-[calc(100vw-2rem)] bg-paper-light border border-ink shadow-stamp">
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
        </div>
      )}
    </div>
  )
}
