import { useEffect, useMemo, useRef, useState } from 'react'
import {
  addMonths, eachDayOfInterval, endOfMonth, format,
  isToday, parseISO, startOfMonth,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { dayKey, dayToRange, rangeToDay, presetToRange, rangeToPreset } from '../utils/urlFilters'

interface DatePickerProps {
  value: { start: Date | null; end: Date | null }
  onChange: (next: { start: Date | null; end: Date | null }) => void
  /** Horizontal anchor of the popover. */
  align?: 'left' | 'right'
  className?: string
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function buttonLabel(value: { start: Date | null; end: Date | null }): string {
  const day = rangeToDay(value)
  if (day) {
    const d = parseISO(day)
    if (isToday(d)) return 'Today'
    return format(d, 'EEE, MMM d')
  }
  if (rangeToPreset(value) === 'weekend') return 'This weekend'
  if (value.start && value.end) return `${format(value.start, 'MMM d')} – ${format(value.end, 'MMM d')}`
  return 'Anytime'
}

export default function DatePicker({ value, onChange, align = 'left', className = '' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selectedDay = rangeToDay(value)
  const [viewMonth, setViewMonth] = useState(() =>
    startOfMonth(selectedDay ? parseISO(selectedDay) : new Date()))
  const ref = useRef<HTMLDivElement>(null)

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
    const lead = first.getDay() // blanks before the 1st
    const cells: (Date | null)[] = Array(lead).fill(null)
    for (const d of eachDayOfInterval({ start: first, end: last })) cells.push(d)
    return cells
  }, [viewMonth])

  const pick = (d: Date) => { onChange(dayToRange(dayKey(d))); setOpen(false) }
  const active = !!(value.start || value.end)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className={`inline-flex items-center gap-2 px-3.5 py-2 md:py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors whitespace-nowrap ${
          active ? 'bg-bridge-500 text-paper-light shadow-stamp' : 'bg-paper-light text-ink hover:bg-paper'
        }`}
      >
        <CalendarDays size={14} strokeWidth={2.2} />
        {buttonLabel(value)}
        {active && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            onClick={(e) => { e.stopPropagation(); onChange({ start: null, end: null }) }}
            className="ml-0.5 -mr-1 inline-flex items-center justify-center w-4 h-4 hover:opacity-70"
          >
            <X size={12} strokeWidth={2.5} />
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute top-full mt-2 z-[1500] w-[286px] max-w-[calc(100vw-2rem)] bg-paper-light border border-ink shadow-stamp p-3 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Quick shortcuts */}
          <div className="flex items-center gap-1.5 mb-3">
            {[
              { label: 'Anytime', on: () => { onChange({ start: null, end: null }); setOpen(false) }, sel: !active },
              { label: 'Today', on: () => pick(new Date()), sel: selectedDay === dayKey(new Date()) },
              { label: 'Weekend', on: () => { onChange(presetToRange('weekend')); setOpen(false) }, sel: rangeToPreset(value) === 'weekend' },
            ].map(s => (
              <button
                key={s.label}
                type="button"
                onClick={s.on}
                className={`flex-1 px-2 py-1.5 border border-ink font-mono text-[10px] uppercase tracking-[0.12em] font-semibold transition-colors ${
                  s.sel ? 'bg-ink text-paper-light' : 'bg-paper-light text-ink-mute hover:text-ink hover:bg-paper'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

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
              const today = isToday(d)
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => pick(d)}
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
      )}
    </div>
  )
}
