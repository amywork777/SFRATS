import RatMark from './RatMark'
import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { DbItem } from '../types/supabase'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { EventIcon, eventEmoji } from './EventIcon'
import { eventType } from '../utils/eventTypes'

interface SubmissionsListProps {
  items: DbItem[]
  loading: boolean
  error: string | null
}

export default function SubmissionsList({ items: events, loading, error }: SubmissionsListProps) {
  const [isOpen, setIsOpen] = useState(false)
  const items = events.slice(0, 6)

  return (
    <div className="recent-events fixed bottom-7 right-6 w-[320px] z-[1000] pointer-events-none">
      <div className="pointer-events-auto bg-paper-light border border-ink/20">
        {/* Toggle the latest events. */}
        <button
          aria-expanded={isOpen}
          onClick={() => setIsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-paper transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <RatMark size={32} />
            <span className="font-sans text-[11px] uppercase tracking-[0.14em] font-semibold text-ink">
              Just&nbsp;Posted
            </span>
            {items.length > 0 && (
              <span className="font-sans text-[10px] text-ink-fade">
                · {items.length}
              </span>
            )}
          </div>
          {isOpen ? (
            <ChevronDown size={16} strokeWidth={2.2} className="text-ink-mute" />
          ) : (
            <ChevronUp size={16} strokeWidth={2.2} className="text-ink-mute" />
          )}
        </button>

        {isOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-t border-ink/20">
            {loading ? (
              <div className="p-4 font-sans text-[11px] uppercase tracking-[0.14em] text-ink-mute">Loading…</div>
            ) : error ? (<p className="p-4 text-sm text-ink-mute">Events could not load.</p>) : items.length === 0 ? (
              <div className="p-4 font-sans text-[11px] uppercase tracking-[0.14em] text-ink-mute">No listings yet.</div>
            ) : (
              <ul>
                {items.map((item, i) => (
                  <li key={item.id} className={i > 0 ? 'border-t border-ink/15' : ''}>
                    <Link
                      to={`/listing/${item.id}`}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-paper transition-colors"
                    >
                      <span
                        className="mt-0.5 inline-flex w-9 h-9 items-center justify-center bg-paper-light border border-ink/30 text-[18px] shrink-0 leading-none"
                        aria-hidden
                      >
                        <EventIcon type={eventType(item)} emoji={eventEmoji(item)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-[15px] leading-tight text-ink truncate">
                          {item.title}
                        </h3>
                        <p className="font-sans text-[10px] uppercase tracking-[0.12em] text-ink-fade mt-1">
                          {format(new Date(item.created_at), 'MMM d · h:mm a')} · {item.category}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
