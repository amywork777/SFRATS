import { useMemo } from 'react'
import { format, isToday, isTomorrow, isYesterday } from 'date-fns'
import { ArrowUpRight } from 'lucide-react'
import { DbItem } from '../types/supabase'
import { inferEmoji } from '../utils/categoryIcons'

interface ListViewProps {
  items: DbItem[]
  loading: boolean
  error: string | null
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
  // Trim "San Francisco, CA, USA" tails for compactness
  return item.location_address
    .replace(/,\s*San Francisco.*$/i, '')
    .replace(/,\s*CA(\s*\d{5})?.*$/i, '')
    .trim()
}

export default function ListView({ items, loading, error }: ListViewProps) {
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
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bridge-700">Error</span>
          <p className="font-display text-[16px] text-ink mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (grouped.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-16 text-center">
        <p className="font-display text-[20px] text-ink-mute">No listings yet — be the first to post.</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      {grouped.map(({ date, items }, gi) => {
        const { day, sub, todayLike } = dateHeader(date)
        return (
          <section key={gi} className="mb-10">
            <div className="flex items-baseline gap-3 pb-2 mb-4 border-b border-ink/15">
              <h2 className="font-display font-bold text-2xl text-ink leading-none tracking-tight">
                {day}
                {todayLike && <span className="inline-block w-1.5 h-1.5 ml-2 bg-bridge-500 rounded-full align-middle" />}
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-fade">
                · {sub}
              </span>
            </div>

            <ul className="space-y-3">
              {items.map(item => {
                const emoji = item.emoji || inferEmoji(item.title, item.description, item.category)
                const time  = timeLabel(item)
                const place = locationLabel(item)
                const source = item.posted_by ? (SOURCE_LABEL[item.posted_by] ?? item.posted_by) : null
                const href  = item.url || `/listing/${item.id}`
                return (
                  <li key={item.id}>
                    <a
                      href={href}
                      target={item.url ? '_blank' : undefined}
                      rel={item.url ? 'noopener noreferrer' : undefined}
                      className="group block bg-paper-light border border-ink/20 px-5 py-4 hover:border-ink hover:shadow-stamp transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <span className="shrink-0 inline-flex items-center justify-center w-11 h-11 text-[22px] bg-paper border border-ink/15">
                          {emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className="font-display font-bold text-[18px] leading-tight text-ink">
                              {item.title}
                            </h3>
                            <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 bg-bridge-50 text-bridge-700 border border-bridge-200 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold">
                              Free
                            </span>
                          </div>

                          {(time || place) && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 mb-2 font-mono text-[11px] text-ink-mute">
                              {time && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="text-bridge-500">◷</span> {time}
                                </span>
                              )}
                              {place && (
                                <span className="inline-flex items-center gap-1.5 truncate">
                                  <span className="text-bridge-500">◇</span> <span className="truncate">{place}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {item.description && (
                            <p className="text-[13px] leading-snug text-ink-soft line-clamp-2">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            {source && (
                              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-fade">
                                {source}
                              </span>
                            )}
                            <ArrowUpRight
                              size={14}
                              strokeWidth={2.2}
                              className="ml-auto text-ink-fade opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                        </div>
                      </div>
                    </a>
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
