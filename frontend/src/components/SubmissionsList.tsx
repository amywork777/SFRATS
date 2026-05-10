import { useEffect, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
import { inferEmoji } from '../utils/categoryIcons'
import { isActive } from '../utils/listingFilters'

export default function SubmissionsList() {
  const [isOpen, setIsOpen] = useState(false)
  const [items, setItems] = useState<DbItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!isOpen || loaded) return
    setLoading(true)
    api.getItems()
      .then((data) => {
        // Hide scraper-meta diagnostic rows + expired listings
        const visible = data.filter(r => r.posted_by !== 'scraper-meta' && isActive(r))
        setItems(visible.slice(0, 6))
      })
      .catch((err) => console.error('Error fetching items:', err))
      .finally(() => {
        setLoading(false)
        setLoaded(true)
      })
  }, [isOpen, loaded])

  return (
    <div className="fixed bottom-5 right-5 w-[320px] z-[1000] pointer-events-none">
      <div className="pointer-events-auto bg-paper-light border-2 border-ink shadow-stamp">
        {/* Header — toggleable. Looks like a punched card. */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-paper transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2 h-2 bg-bridge-500 animate-pulse" aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] font-semibold text-ink">
              Just&nbsp;Posted
            </span>
            {items.length > 0 && (
              <span className="font-mono text-[10px] text-ink-fade">
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
          <div className="max-h-[60vh] overflow-y-auto border-t-2 border-ink">
            {loading ? (
              <div className="p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute">No listings yet.</div>
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
                        {item.emoji || inferEmoji(item.title, item.description, item.category)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-[15px] leading-tight text-ink truncate">
                          {item.title}
                        </h3>
                        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-fade mt-1">
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
