import RatMark from './RatMark'
import { useMemo, useEffect, useRef } from 'react'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ArrowUpRight, Clock, MapPin } from 'lucide-react'
import { DbItem } from '../types/supabase'
import { EventIcon, eventEmoji } from './EventIcon'
import { eventType } from '../utils/eventTypes'
import AddToCalendar from './AddToCalendar'

interface ListViewProps {
  items: DbItem[]
  loading: boolean
  error: string | null
  compact?: boolean
  selectedId?: number | null
  highlightedId?: number | null
  onSelect?: (id: number) => void
  onHighlight?: (id: number | null) => void
}

const SOURCE_LABEL: Record<string, string> = {
  funcheap:    'Funcheap',
  reddit:      'Reddit',
  eventbrite:  'Eventbrite',
  craigslist:  'Craigslist',
  sfpl:        'SF Public Library',
  'sf-recpark': 'SF Rec & Park',
}

function dateKey(iso: string | null | undefined) {
  if (!iso) return null
  return format(new Date(iso), 'yyyy-MM-dd')
}

function dateHeader(d: Date) {
  const day = isToday(d) ? 'Today' : isTomorrow(d) ? 'Tomorrow' : isYesterday(d) ? 'Yesterday' : format(d, 'EEEE')
  const sub = format(d, 'MMM d')
  return { day, sub, todayLike: isToday(d) }
}

function timeLabel(item: DbItem) {
  if (!item.available_from) return null
  const start = new Date(item.available_from)
  const startStr = format(start, 'h:mm a').toLowerCase()
  if (item.available_until) {
    const end = new Date(item.available_until)
    const endStr = format(end, 'h:mm a').toLowerCase()
    return `${startStr} – ${endStr}`
  }
  return startStr
}

function locationLabel(item: DbItem) {
  if (!item.location_address) return null
  // Trim ", CA / CA 94110 / USA" tails for compactness, but keep the city
  // name — events now span the whole Bay Area, so "Oakland" matters.
  return item.location_address
    .replace(/,\s*CA\b(\s*\d{5})?.*$/i, '')
    .replace(/,\s*USA\s*$/i, '')
    .replace(/,\s*$/, '')
    .trim()
}

export default function ListView({ items, loading, error, compact = false, selectedId, highlightedId, onSelect, onHighlight }: ListViewProps) {
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (selectedId != null) listRef.current?.querySelector(`[data-event-id="${selectedId}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [selectedId])
  const grouped = useMemo(() => {
    const visible = items.filter(i => i.posted_by !== 'scraper-meta')
    // Group by available_from date (fall back to created_at)
    const buckets = new Map<string, { date: Date; items: DbItem[] }>()
    for (const i of visible) {
      const iso = i.available_from || i.created_at
      const k = dateKey(iso)
      if (!k) continue
      if (!buckets.has(k)) buckets.set(k, { date: new Date(iso), items: [] })
      buckets.get(k)!.items.push(i)
    }
    // Sort dates ascending; within a date, sort by available_from then title
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, group]) => ({
        ...group,
        items: group.items.sort((a, b) => {
          const ta = a.available_from ? new Date(a.available_from).getTime() : 0
          const tb = b.available_from ? new Date(b.available_from).getTime() : 0
          return ta - tb || a.title.localeCompare(b.title)
        }),
      }))
  }, [items])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10 space-y-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-paper-light border border-ink/15 p-5 animate-pulse">
            <div className="h-3 bg-paper-dark w-24 mb-3" />
            <div className="h-5 bg-paper-dark w-2/3 mb-2" />
            <div className="h-3 bg-paper-dark w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
        <div className="border border-bridge-700 bg-bridge-50 p-4">
          <span className="font-sans text-[10px] uppercase tracking-[0.16em] text-bridge-700">Error</span>
          <p className="font-display text-[16px] text-ink mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (grouped.length === 0) {
    return (
      <div className="brand-empty max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
        <RatMark size={88} tone="yellow" />
        <p className="font-display text-[20px] text-ink-mute">No matching events. Try a different date or clear your filters.</p>
      </div>
    )
  }

  return (
    <div ref={listRef} className={`event-list${compact ? ' event-list--compact' : ''}`}>
      {grouped.map(({ date, items }, gi) => {
        const { day, sub, todayLike } = dateHeader(date)
        return (
          <section key={gi} className="event-day">
            <div className="event-day-heading">
              {compact ? (
                <h3 className="atlas-date-label">{day} · {format(date, 'MMM d')}</h3>
              ) : <>
              <h2 className="font-display font-bold text-2xl text-ink leading-none tracking-tight">
                {day}
                {todayLike && <span className="inline-block w-1.5 h-1.5 ml-2 bg-bridge-500 rounded-full align-middle" />}
              </h2>
              <time className="event-date-badge" dateTime={format(date, 'yyyy-MM-dd')}>{sub}</time>
              </>}
            </div>

            <ul className="event-rows">
              {items.map(item => {
                const type = eventType(item)
                const time  = timeLabel(item)
                const place = locationLabel(item)
                const source = item.posted_by ? (SOURCE_LABEL[item.posted_by] ?? item.posted_by) : null
                const isEvent = item.category === 'Events' && !!item.available_from
                const hasFooter = !!(source || item.url || isEvent)
                return (
                  <li key={item.id} data-event-id={item.id} data-type={type} className={`event-row group${selectedId === item.id ? ' is-selected' : ''}${highlightedId === item.id ? ' is-highlighted' : ''}`}
                    onMouseEnter={() => onHighlight?.(item.id)} onMouseLeave={() => onHighlight?.(null)}
                    onFocus={() => onHighlight?.(item.id)} onBlur={() => onHighlight?.(null)}>
                    {/* The card body navigates to our own listing page. Actions
                        live in a separate footer row below, so they never
                        overlap the text or hijack a tap on the card. */}
                    <a href={`/listing/${item.id}`} className="block px-4 sm:px-5 pt-4 pb-3.5"
                      aria-current={selectedId === item.id ? 'true' : undefined}
                      onClick={e => {
                        if (onSelect && item.location_lat != null && item.location_lng != null && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) {
                          e.preventDefault()
                          onSelect(item.id)
                        }
                      }}>
                      <div className="flex items-start gap-3.5">
                        <span className="event-type-icon">
                          <EventIcon type={type} emoji={eventEmoji(item)} size={20} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2.5 mb-1.5">
                            <h3 className="font-display font-bold text-[17px] sm:text-[18px] leading-snug text-ink">
                              {item.title}
                            </h3>
                          </div>

                          {(time || place) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2 font-sans text-[11px] text-ink-mute">
                              {time && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Clock size={13} aria-hidden />{time}
                                </span>
                              )}
                              {place && (
                                <span className="inline-flex items-center gap-1.5 min-w-0">
                                  <MapPin size={13} className="shrink-0" aria-hidden /><span className="truncate">{place}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {item.description && !compact && (
                            <p className="text-[13px] leading-snug text-ink-soft line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>

                    {hasFooter && !compact && (
                      <div className="flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 border-t border-ink/10">
                        <span className="font-sans text-[10px] uppercase tracking-[0.14em] text-ink-fade truncate">
                          {source || ''}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Open original source"
                              aria-label="Open original source"
                              className="inline-flex items-center justify-center w-9 h-9 bg-paper-light text-ink border border-ink shadow-stamp    transition-all"
                            >
                              <ArrowUpRight size={14} strokeWidth={2.2} />
                            </a>
                          )}
                          {isEvent && (
                            <AddToCalendar
                              title={item.title}
                              description={item.description}
                              location={item.location_address}
                              startsAt={item.available_from!}
                              endsAt={item.available_until}
                              url={typeof window !== 'undefined' ? `${window.location.origin}/listing/${item.id}` : undefined}
                              variant="secondary"
                              dropUp
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
