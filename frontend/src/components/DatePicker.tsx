import { useMemo, useState } from 'react'
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, format,
  isToday, parseISO, startOfMonth,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { dayKey, dayToRange, rangeFromKeys, rangeToDay, presetToRange, rangeToPreset } from '../utils/urlFilters'
import FilterDropdown from './FilterDropdown'

interface DatePickerProps {
  value: { start: Date | null; end: Date | null }
  onChange: (next: { start: Date | null; end: Date | null }) => void
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// "When" filter as a single dropdown: quick presets (Anytime / Today /
// Tomorrow / This weekend) plus a calendar for any specific day. Matches the
// other filter dropdowns so the toolbar reads as one consistent set.
export default function DatePicker({ value, onChange }: DatePickerProps) {
  const todayKey = dayKey(new Date())
  const tomorrowKey = dayKey(addDays(new Date(), 1))
  const selectedDay = rangeToDay(value)
  const isToday = selectedDay === todayKey
  const isTomorrow = selectedDay === tomorrowKey
  const isWeekend = rangeToPreset(value) === 'weekend'
  // A specific calendar day that isn't already covered by a quick preset.
  const specificDay = selectedDay && !isToday && !isTomorrow ? selectedDay : null
  const active = !!(value.start || value.end)
  const isRange = !!(value.start && value.end) && dayKey(value.start) !== dayKey(value.end) && !isWeekend

  // Two-click range selection: first click sets the anchor, second sets the end.
  // hoverDay drives the live preview between the two clicks.
  const [rangeAnchor, setRangeAnchor] = useState<Date | null>(null)
  const [hoverDay, setHoverDay] = useState<Date | null>(null)

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDay ? parseISO(selectedDay) : new Date()))

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth)
    const last = endOfMonth(viewMonth)
    const cells: (Date | null)[] = Array(first.getDay()).fill(null)
    for (const d of eachDayOfInterval({ start: first, end: last })) cells.push(d)
    return cells
  }, [viewMonth])

  // Short label shown on the trigger chip.
  const label =
    isToday ? 'Today'
    : isTomorrow ? 'Tomorrow'
    : isWeekend ? 'Weekend'
    : isRange && value.start && value.end ? `${format(value.start, 'MMM d')} – ${format(value.end, 'MMM d')}`
    : specificDay ? format(parseISO(specificDay), 'MMM d')
    : 'When'

  const onDayClick = (d: Date, close: () => void) => {
    if (!rangeAnchor) {
      // First click — start a range (also a valid single-day filter for now).
      setRangeAnchor(d)
      onChange(rangeFromKeys(dayKey(d), dayKey(d)))
    } else {
      // Second click — commit the span and close.
      onChange(rangeFromKeys(dayKey(rangeAnchor), dayKey(d)))
      setRangeAnchor(null)
      setHoverDay(null)
      close()
    }
  }

  // Highlight bounds: the committed range, or the in-progress preview.
  let loKey = value.start ? dayKey(value.start) : null
  let hiKey = value.end ? dayKey(value.end) : null
  if (rangeAnchor) {
    const h = hoverDay ?? rangeAnchor
    const [a, b] = h >= rangeAnchor ? [rangeAnchor, h] : [h, rangeAnchor]
    loKey = dayKey(a); hiKey = dayKey(b)
  }

  const quick = [
    { key: 'anytime',  label: 'Anytime',      on: !active,    apply: () => onChange({ start: null, end: null }) },
    { key: 'today',    label: 'Today',        on: isToday,    apply: () => onChange(dayToRange(todayKey)) },
    { key: 'tomorrow', label: 'Tomorrow',     on: isTomorrow, apply: () => onChange(dayToRange(tomorrowKey)) },
    { key: 'weekend',  label: 'This weekend', on: isWeekend,  apply: () => onChange(presetToRange('weekend')) },
  ]

  return (
    <FilterDropdown
      active={active}
      panelClassName="w-[286px]"
      onOpenChange={(o) => { if (o) { setRangeAnchor(null); setHoverDay(null) } }}
      label={
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={13} strokeWidth={2.2} />
          {label}
        </span>
      }
    >
      {(close) => (
        <>
          {/* Quick presets */}
          <div className="flex flex-col pt-1">
            {quick.map(q => (
              <button
                key={q.key}
                type="button"
                onClick={() => { q.apply(); close() }}
                aria-pressed={q.on}
                className={`w-full flex items-center justify-between px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-left transition-colors ${
                  q.on ? 'bg-ink text-paper-light' : 'text-ink-mute hover:bg-paper hover:text-ink'
                }`}
              >
                {q.label}
                {q.on && <Check size={13} strokeWidth={2.6} />}
              </button>
            ))}
          </div>

          {/* Calendar — pick any specific day */}
          <div className="border-t border-ink/15 px-3 pt-2 pb-3 mt-1">
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={() => setViewMonth(m => addMonths(m, -1))}
                className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} strokeWidth={2.2} />
              </button>
              <span className="font-display font-bold text-[15px] text-ink">
                {format(viewMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(m => addMonths(m, 1))}
                className="p-1.5 text-ink-mute hover:text-ink hover:bg-paper transition-colors"
                aria-label="Next month"
              >
                <ChevronRight size={16} strokeWidth={2.2} />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-ink-fade py-1">
                  {w}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5" onMouseLeave={() => setHoverDay(null)}>
              {days.map((d, i) => {
                if (!d) return <span key={i} />
                const k = dayKey(d)
                const isEnd = k === loKey || k === hiKey
                const inRange = !!loKey && !!hiKey && k >= loKey && k <= hiKey
                const today = isTodayFn(d)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onDayClick(d, close)}
                    onMouseEnter={() => { if (rangeAnchor) setHoverDay(d) }}
                    className={`aspect-square flex items-center justify-center font-mono text-[12px] border transition-colors ${
                      isEnd
                        ? 'bg-bridge-500 text-paper-light border-ink font-bold'
                        : inRange
                          ? 'bg-bridge-500/15 text-ink border-transparent'
                          : today
                            ? 'border-bridge-300 text-ink hover:bg-paper'
                            : 'border-transparent text-ink-soft hover:bg-paper hover:border-ink/20'
                    }`}
                  >
                    {format(d, 'd')}
                  </button>
                )
              })}
            </div>
            {rangeAnchor && (
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-bridge-700">
                Pick an end day…
              </p>
            )}
          </div>
        </>
      )}
    </FilterDropdown>
  )
}

// Local alias so the selection-state `isToday` doesn't shadow date-fns' isToday
// used for per-cell "is this cell today" checks.
function isTodayFn(d: Date) { return isToday(d) }
