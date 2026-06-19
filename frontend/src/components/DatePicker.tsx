import { useMemo, useState } from 'react'
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, format,
  isToday, parseISO, startOfMonth,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { dayKey, dayToRange, rangeToDay, presetToRange, rangeToPreset } from '../utils/urlFilters'
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
    : specificDay ? format(parseISO(specificDay), 'MMM d')
    : 'When'

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

            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d, i) => {
                if (!d) return <span key={i} />
                const sel = selectedDay === dayKey(d)
                const today = isTodayFn(d)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { onChange(dayToRange(dayKey(d))); close() }}
                    className={`aspect-square flex items-center justify-center font-mono text-[12px] border transition-colors ${
                      sel
                        ? 'bg-bridge-500 text-paper-light border-ink font-bold'
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
          </div>
        </>
      )}
    </FilterDropdown>
  )
}

// Local alias so the selection-state `isToday` doesn't shadow date-fns' isToday
// used for per-cell "is this cell today" checks.
function isTodayFn(d: Date) { return isToday(d) }
