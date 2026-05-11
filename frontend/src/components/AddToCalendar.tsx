import { useEffect, useRef, useState } from 'react'
import { Calendar, ChevronDown, ExternalLink, Download } from 'lucide-react'

interface AddToCalendarProps {
  title: string
  description?: string | null
  location?: string | null
  startsAt: string | Date
  endsAt?: string | Date | null
  url?: string | null
  /** "primary" = filled orange CTA, "secondary" = outlined paper button */
  variant?: 'primary' | 'secondary'
  /** Open the menu upward instead of down (useful inside bottom sheets) */
  dropUp?: boolean
  /** Stretch the button to fill its container */
  fullWidth?: boolean
}

const DEFAULT_DURATION_MS = 2 * 60 * 60 * 1000

// YYYYMMDDTHHMMSSZ — the format Google Calendar and iCal both want
function toCalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

// iCal escaping per RFC 5545: commas, semicolons, and backslashes
// must be backslash-prefixed; newlines become literal "\n".
function icsEscape(s: string) {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function buildGoogleUrl(p: AddToCalendarProps, start: Date, end: Date) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text:   p.title,
    dates:  `${toCalDate(start)}/${toCalDate(end)}`,
  })
  if (p.description) params.set('details',  p.description)
  if (p.location)    params.set('location', p.location)
  return `https://www.google.com/calendar/render?${params.toString()}`
}

function buildIcs(p: AddToCalendarProps, start: Date, end: Date) {
  const uid = `${start.getTime()}-${p.title.replace(/\s+/g, '-').toLowerCase().slice(0, 40)}@sfrats.com`
  const desc = [p.description, p.url].filter(Boolean).join('\n\n')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SFRATS//sfrats.com//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toCalDate(new Date())}`,
    `DTSTART:${toCalDate(start)}`,
    `DTEND:${toCalDate(end)}`,
    `SUMMARY:${icsEscape(p.title)}`,
    desc       ? `DESCRIPTION:${icsEscape(desc)}` : '',
    p.location ? `LOCATION:${icsEscape(p.location)}` : '',
    p.url      ? `URL:${p.url}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)
  return lines.join('\r\n')
}

export default function AddToCalendar(props: AddToCalendarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const start = new Date(props.startsAt)
  if (Number.isNaN(start.getTime())) return null
  const end = props.endsAt ? new Date(props.endsAt) : new Date(start.getTime() + DEFAULT_DURATION_MS)
  const safeEnd = Number.isNaN(end.getTime()) || end <= start
    ? new Date(start.getTime() + DEFAULT_DURATION_MS)
    : end

  const handleDownloadIcs = () => {
    const blob = new Blob([buildIcs(props, start, safeEnd)], { type: 'text/calendar;charset=utf-8' })
    const href = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = href
    a.download = `${props.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60)}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(href)
    setOpen(false)
  }

  const variant   = props.variant   ?? 'secondary'
  const fullWidth = props.fullWidth ?? false
  const buttonTone = variant === 'primary'
    ? 'bg-bridge-500 text-paper-light'
    : 'bg-paper-light text-ink'

  return (
    <div ref={ref} className={`relative ${fullWidth ? 'block w-full' : 'inline-block'}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v) }}
        aria-expanded={open}
        className={`${fullWidth ? 'w-full justify-center' : ''} inline-flex items-center gap-1.5 ${buttonTone} border border-ink shadow-stamp px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all`}
      >
        <Calendar size={13} strokeWidth={2.2} />
        Add to calendar
        <ChevronDown size={12} strokeWidth={2.2} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute z-50 left-0 ${props.dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'} w-[240px] bg-paper-light border border-ink shadow-stamp`}>
          <a
            href={buildGoogleUrl(props, start, safeEnd)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-paper transition-colors border-b border-ink/10"
          >
            <span aria-hidden className="text-[16px] leading-none shrink-0">📅</span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-bold text-[13px] text-ink">Google Calendar</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-fade">opens in a new tab</span>
            </span>
            <ExternalLink size={11} strokeWidth={2.2} className="text-ink-fade shrink-0" />
          </a>
          <button
            type="button"
            onClick={handleDownloadIcs}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-paper transition-colors text-left"
          >
            <span aria-hidden className="text-[16px] leading-none shrink-0">🗓️</span>
            <span className="flex-1 min-w-0">
              <span className="block font-display font-bold text-[13px] text-ink">Apple / Outlook / iCal</span>
              <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-fade">downloads .ics</span>
            </span>
            <Download size={11} strokeWidth={2.2} className="text-ink-fade shrink-0" />
          </button>
        </div>
      )}
    </div>
  )
}
