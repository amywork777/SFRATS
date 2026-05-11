interface DateChipsProps {
  start: Date | null
  end: Date | null
  onChange: (dates: { start: Date | null; end: Date | null }) => void
}

type Preset = { id: string; label: string; range: () => { start: Date | null; end: Date | null } }

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// Returns the date window for "this weekend" relative to today. If today is
// Mon–Thu, this points at the next Sat 00:00 → Sun 23:59. If we're already
// in the weekend (Fri evening / Sat / Sun), include the current day so the
// chip stays useful right when people are looking.
function weekendRange() {
  const now = new Date()
  const dow = now.getDay() // 0 = Sun, 5 = Fri, 6 = Sat
  if (dow === 0)             return { start: startOfDay(now),        end: endOfDay(now) }
  if (dow === 6)             return { start: startOfDay(now),        end: endOfDay(addDays(now, 1)) }
  if (dow === 5)             return { start: startOfDay(now),        end: endOfDay(addDays(now, 2)) }
  const daysUntilSat = 6 - dow
  return { start: startOfDay(addDays(now, daysUntilSat)), end: endOfDay(addDays(now, daysUntilSat + 1)) }
}

const PRESETS: Preset[] = [
  { id: 'all',      label: 'Anytime',      range: () => ({ start: null,              end: null }) },
  { id: 'tonight',  label: 'Tonight',      range: () => ({ start: new Date(),        end: endOfDay(new Date()) }) },
  { id: 'tomorrow', label: 'Tomorrow',     range: () => { const t = addDays(new Date(), 1); return { start: startOfDay(t), end: endOfDay(t) } } },
  { id: 'weekend',  label: 'This weekend', range: weekendRange },
  { id: 'week',     label: 'Next 7 days',  range: () => ({ start: new Date(), end: endOfDay(addDays(new Date(), 7)) }) },
]

// Cheap signature so we can match the current filter back to a preset.
const sig = (r: { start: Date | null; end: Date | null }) =>
  `${r.start ? Math.round(r.start.getTime() / 60000) : 'n'}|${r.end ? Math.round(r.end.getTime() / 60000) : 'n'}`

export default function DateChips({ start, end, onChange }: DateChipsProps) {
  const current = sig({ start, end })

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-3 md:px-5 py-2 bg-paper border-b border-ink/15">
      {PRESETS.map(p => {
        const range = p.range()
        const active = sig(range) === current
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(range)}
            aria-pressed={active}
            className={`shrink-0 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold border transition-colors whitespace-nowrap ${
              active
                ? 'bg-bridge-500 text-paper-light border-ink shadow-stamp'
                : 'bg-paper-light text-ink-mute border-ink/20 hover:text-ink hover:border-ink'
            }`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
