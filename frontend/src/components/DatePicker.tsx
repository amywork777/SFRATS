import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addDays, addMonths, eachDayOfInterval, endOfMonth, format,
  isToday, parseISO, startOfMonth,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { dayKey, dayToRange, rangeToDay, presetToRange, rangeToPreset } from '../utils/urlFilters'

interface DatePickerProps {
  value: { start: Date | null; end: Date | null }
  onChange: (next: { start: Date | null; end: Date | null }) => void
  /** Horizontal anchor of the calendar popover. */
  align?: 'left' | 'right'
  className?: string
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const chipCls = (active: boolean) =>
  `shrink-0 px-3.5 py-2 md:py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors whitespace-nowrap ${
    active
      ? 'bg-bridge-500 text-paper-light shadow-stamp'
      : 'bg-paper-light text-ink-mute hover:text-ink hover:bg-paper'
  }`

export default function DatePicker({ value, onChange, align = 'left', className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const todayKey = dayKey(new Date())
  const tomorrowKey = dayKey(addDays(new Date(), 1))
  const selectedDay = rangeToDay(value)
  const isToday = selectedDay === todayKey
  const isTomorrow = selectedDay === tomorrowKey
  const isWeekend = rangeToPreset(value) === 'weekend'
  // A specific calendar day that isn't already covered by a quick chip.
  const specificDay = selectedDay && !isToday && !isTomorrow ? selectedDay : null

  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDay ? parseISO(selectedDay) : new Date()))

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

  const days = useMemo(() => {
    const first = startOfMonth(viewMonth)
    const last = endOfMonth(viewMonth)
    const cells: (Date | null)[] = Array(first.getDay()).fill(null)
    for (const d of eachDayOfInterval({ start: first, end: last })) cells.push(d)
    return cells
  }, [viewMonth])

  const clear = () => onChange({ start: null, end: null })
  const setDay = (key: string) => onChange(dayToRange(key))
  const pickFromCalendar = (d: Date) => { onChange(dayToRange(dayKey(d))); setOpen(false) }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <button type="button" onClick={() => isToday ? clear() : setDay(todayKey)} className={chipCls(isToday)}>
        Today
      </button>
      <button type="button" onClick={() => isTomorrow ? clear() : setDay(tomorrowKey)} className={chipCls(isTomorrow)}>
        Tomorrow
      </button>
      <button type="button" onClick={() => isWeekend ? clear() : onChange(presetToRange('weekend'))} className={chipCls(isWeekend)}>
        This weekend
      </button>

      {/* Calendar — pick any specific day */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className={`${chipCls(!!specificDay)} inline-flex items-center gap-1.5`}
        >
          <CalendarDays size={13} strokeWidth={2.2} />
          {specificDay ? format(parseISO(specificDay), 'MMM d') : 'Calendar'}
        </button>

        {open && (
          <div
            className={`absolute top-full mt-2 z-[1500] w-[286px] max-w-[calc(100vw-2rem)] bg-paper-light border border-ink shadow-stamp p-3 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
          >
            {/* Month header */}
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

            {/* Weekday row */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w, i) => (
                <span key={i} className="text-center font-mono text-[9px] uppercase tracking-[0.1em] text-ink-fade py-1">
                  {w}
                </span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {days.map((d, i) => {
                if (!d) return <span key={i} />
                const sel = selectedDay === dayKey(d)
                const today = isTodayFn(d)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickFromCalendar(d)}
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

            {/* Clear */}
            <button
              type="button"
              onClick={() => { clear(); setOpen(false) }}
              className="mt-3 w-full py-1.5 border border-ink/30 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold text-ink-mute hover:text-ink hover:bg-paper transition-colors"
            >
              Anytime (clear)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Local alias so the variable name `isToday` (selection state) doesn't shadow
// date-fns' isToday for per-cell "is this cell today" checks.
function isTodayFn(d: Date) { return isToday(d) }
