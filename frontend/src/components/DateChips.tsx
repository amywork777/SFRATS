import { presetToRange, rangeToPreset, type DatePresetId } from '../utils/urlFilters'

interface DateChipsProps {
  start: Date | null
  end: Date | null
  onChange: (next: { start: Date | null; end: Date | null }) => void
}

const PRESETS: { id: DatePresetId; label: string }[] = [
  { id: 'all',      label: 'Anytime' },
  { id: 'tonight',  label: 'Tonight' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend',  label: 'This weekend' },
  { id: 'week',     label: 'Next 7 days' },
]

export default function DateChips({ start, end, onChange }: DateChipsProps) {
  const activeId = rangeToPreset({ start, end })

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-3 md:px-5 pb-2.5 bg-paper-light border-b border-ink/15">
      {PRESETS.map(p => {
        const active = activeId === p.id
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(presetToRange(p.id))}
            aria-pressed={active}
            className={`shrink-0 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] font-semibold border border-ink transition-colors whitespace-nowrap ${
              active
                ? 'bg-bridge-500 text-paper-light shadow-stamp'
                : 'bg-paper-light text-ink-mute hover:text-ink hover:bg-paper'
            }`}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
